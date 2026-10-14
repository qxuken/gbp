package monitoring

import (
	"context"
	"io"
	"log/slog"
	"maps"
	"slices"

	"github.com/pocketbase/pocketbase/core"
	"github.com/prometheus/client_golang/prometheus"
)

// bindLogs counts every app log entry persisted into _logs by level and kind
// (access log or not), and with a non-nil mirror also writes it there as a
// JSON line. Entries PocketBase drops (below the min level, or logs retention
// set to 0) are neither counted nor mirrored.
func bindLogs(app core.App, reg prometheus.Registerer, mirror io.Writer) {
	entries := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "gbp_log_entries_total",
		Help: `App log entries by level; type is "request" for access logs, "app" otherwise.`,
	}, []string{"level", "type"})
	reg.MustRegister(entries)
	for _, level := range []slog.Level{slog.LevelDebug, slog.LevelInfo, slog.LevelWarn, slog.LevelError} {
		for _, kind := range []string{"request", "app"} {
			entries.WithLabelValues(level.String(), kind)
		}
	}

	var handler slog.Handler
	if mirror != nil {
		handler = slog.NewJSONHandler(mirror, &slog.HandlerOptions{Level: slog.Level(-100)})
	}

	// Not OnModelAfterCreateSuccess: PocketBase saves a batch of logs in one
	// transaction reusing a single *core.Log, so by the time the after-commit
	// hooks run every event points at the last entry of the batch.
	app.OnModelCreate(core.LogsTableName).BindFunc(func(e *core.ModelEvent) error {
		if err := e.Next(); err != nil {
			return err
		}
		l, ok := e.Model.(*core.Log)
		if !ok {
			return nil
		}
		kind := "app"
		if l.Data["type"] == "request" {
			kind = "request"
		}
		entries.WithLabelValues(slog.Level(l.Level).String(), kind).Inc()
		if handler != nil {
			writeLog(handler, l)
		}
		return nil
	})
}

func writeLog(handler slog.Handler, l *core.Log) {
	r := slog.NewRecord(l.Created.Time(), slog.Level(l.Level), l.Message, 0)
	for _, k := range slices.Sorted(maps.Keys(l.Data)) {
		r.AddAttrs(slog.Any(k, l.Data[k]))
	}
	_ = handler.Handle(context.Background(), r)
}
