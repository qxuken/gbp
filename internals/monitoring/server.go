package monitoring

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// bindServer serves /metrics on its own listener for the lifetime of `serve`,
// so the endpoint is never reachable through the public port.
func bindServer(app core.App, cfg Config, gatherer prometheus.Gatherer) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		ln, err := net.Listen("tcp", cfg.MetricsAddr)
		if err != nil {
			return fmt.Errorf("metrics listener: %w", err)
		}

		srv := &http.Server{
			Handler:           metricsHandler(cfg.MetricsToken, gatherer),
			ReadHeaderTimeout: 10 * time.Second,
		}
		go func() {
			if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
				app.Logger().Error("Metrics server stopped", "error", err.Error())
			}
		}()

		app.OnTerminate().BindFunc(func(e *core.TerminateEvent) error {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			_ = srv.Shutdown(ctx)
			return e.Next()
		})

		app.Logger().Info("Serving metrics", "addr", ln.Addr().String())
		return se.Next()
	})
}

func metricsHandler(token string, gatherer prometheus.Gatherer) http.Handler {
	metrics := promhttp.HandlerFor(gatherer, promhttp.HandlerOpts{})
	mux := http.NewServeMux()
	mux.HandleFunc("GET /metrics", func(w http.ResponseWriter, r *http.Request) {
		if token != "" {
			got := []byte(r.Header.Get("Authorization"))
			want := []byte("Bearer " + token)
			if subtle.ConstantTimeCompare(got, want) != 1 {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
		}
		metrics.ServeHTTP(w, r)
	})
	return mux
}
