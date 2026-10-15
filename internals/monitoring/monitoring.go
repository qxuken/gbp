// Package monitoring exposes the app's Prometheus metrics on a private
// listener. App log entries are counted by level, and optionally mirrored to
// stdout so a log shipper can pick them up (PocketBase itself only persists
// them into auxiliary.db).
package monitoring

import (
	"io"
	"os"
	"runtime"
	"strconv"

	"github.com/pocketbase/pocketbase/core"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
)

// Version is reported by gbp_build_info. Set at build time with
// -ldflags "-X github.com/qxuken/gbp/internals/monitoring.Version=<tag>".
var Version = "dev"

// Config controls what Bind exposes.
type Config struct {
	// MetricsAddr is the listen address of the /metrics endpoint (e.g. ":9091").
	// Empty disables the listener; the metrics are still collected.
	MetricsAddr string
	// MetricsToken, when set, is required as a bearer token on /metrics.
	MetricsToken string
	// LogStdout mirrors every persisted app log entry to stdout as a JSON line.
	// Ignored in dev mode, where PocketBase already prints the logs.
	LogStdout bool
}

// ConfigFromEnv reads the config from GBP_METRICS_ADDR, GBP_METRICS_TOKEN
// and GBP_LOG_STDOUT.
func ConfigFromEnv() Config {
	logStdout, _ := strconv.ParseBool(os.Getenv("GBP_LOG_STDOUT"))
	return Config{
		MetricsAddr:  os.Getenv("GBP_METRICS_ADDR"),
		MetricsToken: os.Getenv("GBP_METRICS_TOKEN"),
		LogStdout:    logStdout,
	}
}

// Bind registers the metrics collectors and hooks on the app and returns the
// registry holding them.
func Bind(app core.App, cfg Config) *prometheus.Registry {
	reg := prometheus.NewRegistry()
	reg.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
		prometheus.NewGaugeFunc(prometheus.GaugeOpts{
			Name:        "gbp_build_info",
			Help:        "Build information, always 1.",
			ConstLabels: prometheus.Labels{"version": Version, "goversion": runtime.Version()},
		}, func() float64 { return 1 }),
		newUsageCollector(app),
	)

	bindHTTPMetrics(app, reg)
	bindRecordMetrics(app, reg)
	bindBackupMetrics(app, reg)

	var logMirror io.Writer
	if cfg.LogStdout && !app.IsDev() {
		logMirror = os.Stdout
	}
	bindLogs(app, reg, logMirror)
	if cfg.MetricsAddr != "" {
		bindServer(app, cfg, reg)
	}

	return reg
}
