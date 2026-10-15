package monitoring

import (
	"context"
	"strings"
	"sync"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/prometheus/client_golang/prometheus"
)

// backupListTimeout bounds the startup listing of the backups filesystem
// (an S3 request when backups are stored remotely).
const backupListTimeout = 30 * time.Second

// backupMetrics tracks the newest successful backup. The gauge stays absent
// until a backup is known, so a missing series is distinguishable from an old one.
type backupMetrics struct {
	last   *prometheus.GaugeVec
	result *prometheus.CounterVec

	mu     sync.Mutex
	newest time.Time
}

// observe moves the gauge to t unless a newer backup is already known.
func (m *backupMetrics) observe(t time.Time) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if !t.After(m.newest) {
		return
	}
	m.newest = t
	m.last.WithLabelValues().Set(float64(t.UnixNano()) / 1e9)
}

// bindBackupMetrics counts backup attempts (manual and cron) and exports the
// time of the newest successful one, seeded on serve from the backups
// filesystem, local or S3.
func bindBackupMetrics(app core.App, reg prometheus.Registerer) {
	m := &backupMetrics{
		last: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "gbp_backup_last_success_timestamp_seconds",
			Help: "Unix time of the newest successful backup; absent until one is known.",
		}, nil),
		result: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "gbp_backups_total",
			Help: "Backup attempts by result.",
		}, []string{"result"}),
	}
	reg.MustRegister(m.last, m.result)
	for _, result := range []string{"success", "failure"} {
		m.result.WithLabelValues(result)
	}

	app.OnBackupCreate().BindFunc(func(e *core.BackupEvent) error {
		if err := e.Next(); err != nil {
			m.result.WithLabelValues("failure").Inc()
			return err
		}
		m.result.WithLabelValues("success").Inc()
		m.observe(time.Now())
		return nil
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// off the startup path: a slow or failing S3 listing must not hold up serving
		go func() {
			newest, err := newestBackup(app)
			if err != nil {
				app.Logger().Warn("Failed to list backups for metrics", "error", err.Error())
				return
			}
			if !newest.IsZero() {
				m.observe(newest)
			}
		}()
		return se.Next()
	})
}

// newestBackup returns the modification time of the newest backup archive,
// or the zero time when there is none.
func newestBackup(app core.App) (time.Time, error) {
	fsys, err := app.NewBackupsFilesystem()
	if err != nil {
		return time.Time{}, err
	}
	defer fsys.Close()

	ctx, cancel := context.WithTimeout(context.Background(), backupListTimeout)
	defer cancel()
	fsys.SetContext(ctx)

	files, err := fsys.List("")
	if err != nil {
		return time.Time{}, err
	}
	var newest time.Time
	for _, f := range files {
		if f.IsDir || !strings.HasSuffix(f.Key, ".zip") {
			continue
		}
		if f.ModTime.After(newest) {
			newest = f.ModTime
		}
	}
	return newest, nil
}
