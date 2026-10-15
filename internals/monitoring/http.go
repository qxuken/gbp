package monitoring

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/hook"
	"github.com/pocketbase/pocketbase/tools/router"
	"github.com/prometheus/client_golang/prometheus"
)

const httpMetricsMiddlewareId = "gbpHttpMetrics"

// bindHTTPMetrics instruments every route with request count and latency,
// labelled by the matched route pattern to keep the cardinality bounded.
func bindHTTPMetrics(app core.App, reg prometheus.Registerer) {
	requests := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "gbp_http_requests_total",
		Help: "HTTP requests by method, matched route and status code.",
	}, []string{"method", "route", "status"})
	duration := prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "gbp_http_request_duration_seconds",
		Help:    "HTTP request latency by method and matched route.",
		Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
	}, []string{"method", "route"})
	inFlight := prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "gbp_http_requests_in_flight",
		Help: "HTTP requests currently being served.",
	})
	reg.MustRegister(requests, duration, inFlight)

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.Bind(&hook.Handler[*core.RequestEvent]{
			Id: httpMetricsMiddlewareId,
			// wrap the activity logger, so the timing covers the same span
			Priority: apis.DefaultActivityLoggerMiddlewarePriority - 1,
			Func: func(e *core.RequestEvent) error {
				inFlight.Inc()
				defer inFlight.Dec()

				start := time.Now()
				err := e.Next()
				elapsed := time.Since(start).Seconds()

				method := e.Request.Method
				route := routeLabel(e.Request)
				requests.WithLabelValues(method, route, strconv.Itoa(responseStatus(e, err))).Inc()
				duration.WithLabelValues(method, route).Observe(elapsed)

				return err
			},
		})
		return se.Next()
	})
}

// routeLabel returns the ServeMux pattern the request matched, without the
// method prefix, e.g. "/api/collections/{collection}/records".
func routeLabel(r *http.Request) string {
	pattern := r.Pattern
	if i := strings.IndexByte(pattern, ' '); i >= 0 {
		pattern = pattern[i+1:]
	}
	if pattern == "" {
		return "unmatched"
	}
	return pattern
}

// responseStatus resolves the status the client will get. A returned error is
// written by the router's error handler only after the middleware chain, so
// its status has to be derived the same way the router does.
func responseStatus(e *core.RequestEvent, err error) int {
	if status := e.Status(); status != 0 {
		return status
	}
	if err != nil {
		var apiErr *router.ApiError
		if errors.As(err, &apiErr) {
			return apiErr.Status
		}
		return router.ToApiError(err).Status
	}
	return http.StatusOK
}
