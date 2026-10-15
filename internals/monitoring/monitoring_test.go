package monitoring

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/prometheus/client_golang/prometheus"

	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/internals/testutil"
)

func TestMain(m *testing.M) {
	testutil.Main(m)
}

// metricValue returns the value of the gathered series matching name and
// labels; histograms report their sample count.
func metricValue(t testing.TB, g prometheus.Gatherer, name string, labels map[string]string) float64 {
	t.Helper()
	families, err := g.Gather()
	if err != nil {
		t.Fatal(err)
	}
	for _, f := range families {
		if f.GetName() != name {
			continue
		}
	metrics:
		for _, m := range f.GetMetric() {
			got := map[string]string{}
			for _, l := range m.GetLabel() {
				got[l.GetName()] = l.GetValue()
			}
			for k, v := range labels {
				if got[k] != v {
					continue metrics
				}
			}
			switch {
			case m.Counter != nil:
				return m.GetCounter().GetValue()
			case m.Gauge != nil:
				return m.GetGauge().GetValue()
			case m.Histogram != nil:
				return float64(m.GetHistogram().GetSampleCount())
			}
		}
	}
	t.Fatalf("no %s series with labels %v", name, labels)
	return 0
}

func TestHTTPMetrics(t *testing.T) {
	var reg *prometheus.Registry
	factory := func(t testing.TB) *tests.TestApp {
		app := testutil.NewTestAppWithoutCleanup(t)
		reg = Bind(app, Config{})
		return app
	}

	scenarios := []struct {
		url    string
		status int
		route  string
	}{
		{"/api/health", http.StatusOK, "/api/health"},
		{"/api/collections/missing/records", http.StatusNotFound, "/api/collections/{collection}/records"},
	}
	for _, s := range scenarios {
		scenario := tests.ApiScenario{
			Name:            s.url,
			Method:          http.MethodGet,
			URL:             s.url,
			ExpectedStatus:  s.status,
			ExpectedContent: []string{"{"},
			TestAppFactory:  factory,
			AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
				labels := map[string]string{"method": http.MethodGet, "route": s.route, "status": strconv.Itoa(s.status)}
				if v := metricValue(t, reg, "gbp_http_requests_total", labels); v != 1 {
					t.Errorf("requests_total %v = %v, want 1", labels, v)
				}
				durationLabels := map[string]string{"method": http.MethodGet, "route": s.route}
				if v := metricValue(t, reg, "gbp_http_request_duration_seconds", durationLabels); v != 1 {
					t.Errorf("duration count %v = %v, want 1", durationLabels, v)
				}
			},
		}
		scenario.Test(t)
	}
}

func createUser(t testing.TB, app core.App, id string, verified bool) *core.Record {
	t.Helper()
	return testutil.CreateRecord(t, app, models.USERS_COLLECTION_NAME, id, map[string]any{
		"email":    id + "@example.com",
		"password": "password123",
		"verified": verified,
		"name":     id,
	})
}

func createCharacterPlan(t testing.TB, app core.App, id string, user string) *core.Record {
	t.Helper()
	return testutil.CreateRecord(t, app, models.CHARACTER_PLANS_COLLECTION_NAME, id, map[string]any{
		"user":      user,
		"character": "characterdiluc0",
	})
}

func TestUsageMetrics(t *testing.T) {
	app := testutil.NewTestApp(t)
	testutil.SeedDictionaries(t, app)
	reg := Bind(app, Config{})

	// the dev superuser migration doesn't run in tests, so these are the only users
	createUser(t, app, "useralpha000000", true)
	createUser(t, app, "userbeta0000000", true)
	createUser(t, app, "usergamma000000", false)
	for _, id := range []string{"planalpha000001", "planalpha000002", "planalpha000003"} {
		createCharacterPlan(t, app, id, "useralpha000000")
	}
	old := createCharacterPlan(t, app, "planbeta0000001", "userbeta0000000")
	testutil.CreateRecord(t, app, models.WEAPON_PLANS_COLLECTION_NAME, "weaponplanbeta1", map[string]any{
		"characterPlan": old.Id,
		"weapon":        "weaponaquila000",
	})
	// push beta's plans out of the 1d window: only the weapon plan stays recent
	if _, err := app.DB().NewQuery("UPDATE characterPlans SET updated = {:t} WHERE id = {:id}").
		Bind(dbx.Params{"t": types.NowDateTime().Add(-48 * time.Hour).String(), "id": old.Id}).
		Execute(); err != nil {
		t.Fatal(err)
	}

	checks := []struct {
		name   string
		labels map[string]string
		want   float64
	}{
		{"gbp_usage_up", nil, 1},
		{"gbp_users", map[string]string{"verified": "true"}, 2},
		{"gbp_users", map[string]string{"verified": "false"}, 1},
		{"gbp_users_new", map[string]string{"window": "1d"}, 3},
		{"gbp_users_active", map[string]string{"window": "1d"}, 2},
		{"gbp_users_active", map[string]string{"window": "30d"}, 2},
		{"gbp_plan_records", map[string]string{"collection": models.CHARACTER_PLANS_COLLECTION_NAME}, 4},
		{"gbp_plan_records", map[string]string{"collection": models.WEAPON_PLANS_COLLECTION_NAME}, 1},
		{"gbp_plan_records", map[string]string{"collection": models.TEAM_PLANS_COLLECTION_NAME}, 0},
		{"gbp_character_plans_per_user", nil, 3},
		{"gbp_character_plans_per_user_max", nil, 3},
		{"gbp_record_writes_total", map[string]string{"collection": models.CHARACTER_PLANS_COLLECTION_NAME, "op": "create"}, 4},
		{"gbp_record_writes_total", map[string]string{"collection": models.USERS_COLLECTION_NAME, "op": "create"}, 3},
	}
	for _, c := range checks {
		if got := metricValue(t, reg, c.name, c.labels); got != c.want {
			t.Errorf("%s%v = %v, want %v", c.name, c.labels, got, c.want)
		}
	}
}

// hasMetric reports whether any series of the named family is gathered.
func hasMetric(t testing.TB, g prometheus.Gatherer, name string) bool {
	t.Helper()
	families, err := g.Gather()
	if err != nil {
		t.Fatal(err)
	}
	for _, f := range families {
		if f.GetName() == name && len(f.GetMetric()) > 0 {
			return true
		}
	}
	return false
}

func TestBackupMetrics(t *testing.T) {
	app := testutil.NewTestApp(t)
	reg := Bind(app, Config{})

	if hasMetric(t, reg, "gbp_backup_last_success_timestamp_seconds") {
		t.Fatal("last success gauge set before any backup")
	}

	before := time.Now()
	if err := app.CreateBackup(context.Background(), "test_backup.zip"); err != nil {
		t.Fatal(err)
	}
	last := metricValue(t, reg, "gbp_backup_last_success_timestamp_seconds", nil)
	if last < float64(before.Unix()) || last > float64(time.Now().Unix()+1) {
		t.Errorf("last success = %v, want between %v and now", last, before.Unix())
	}

	// a hook bound after Bind runs inside its e.Next(), so its error is the backup's
	app.OnBackupCreate().BindFunc(func(e *core.BackupEvent) error {
		return errors.New("upload failed")
	})
	if err := app.CreateBackup(context.Background(), "failed_backup.zip"); err == nil {
		t.Fatal("want backup error")
	}

	for _, c := range []struct {
		result string
		want   float64
	}{
		{"success", 1},
		{"failure", 1},
	} {
		labels := map[string]string{"result": c.result}
		if got := metricValue(t, reg, "gbp_backups_total", labels); got != c.want {
			t.Errorf("gbp_backups_total%v = %v, want %v", labels, got, c.want)
		}
	}
	if got := metricValue(t, reg, "gbp_backup_last_success_timestamp_seconds", nil); got != last {
		t.Errorf("failed backup moved last success from %v to %v", last, got)
	}
}

func TestBackupMetricsSeededOnServe(t *testing.T) {
	app := testutil.NewTestApp(t)
	// only the backup hooks: the HTTP metrics' serve hook needs a router
	reg := prometheus.NewRegistry()
	bindBackupMetrics(app, reg)

	dir := filepath.Join(app.DataDir(), core.LocalBackupsDirName)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		t.Fatal(err)
	}
	older := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	newest := time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC)
	for name, mtime := range map[string]time.Time{"@auto_pb_backup_old.zip": older, "pb_backup_new.zip": newest} {
		path := filepath.Join(dir, name)
		if err := os.WriteFile(path, []byte("zip"), 0o644); err != nil {
			t.Fatal(err)
		}
		if err := os.Chtimes(path, mtime, mtime); err != nil {
			t.Fatal(err)
		}
	}

	err := app.OnServe().Trigger(&core.ServeEvent{App: app}, func(e *core.ServeEvent) error { return nil })
	if err != nil {
		t.Fatal(err)
	}

	// the listing runs in the background
	deadline := time.Now().Add(5 * time.Second)
	for !hasMetric(t, reg, "gbp_backup_last_success_timestamp_seconds") {
		if time.Now().After(deadline) {
			t.Fatal("last success gauge not seeded")
		}
		time.Sleep(10 * time.Millisecond)
	}
	if got := metricValue(t, reg, "gbp_backup_last_success_timestamp_seconds", nil); got != float64(newest.Unix()) {
		t.Errorf("last success = %v, want %v", got, newest.Unix())
	}
}

func TestHistogram(t *testing.T) {
	count, sum, buckets := histogram([]int{0, 0, 1, 4, 200}, []float64{0, 1, 5, 10})
	if count != 5 || sum != 205 {
		t.Fatalf("count %d sum %v", count, sum)
	}
	want := map[float64]uint64{0: 2, 1: 3, 5: 4, 10: 4}
	for b, n := range want {
		if buckets[b] != n {
			t.Errorf("bucket le=%v = %d, want %d", b, buckets[b], n)
		}
	}
}

func TestLogMirror(t *testing.T) {
	app := testutil.NewTestApp(t)
	reg := prometheus.NewRegistry()
	var buf bytes.Buffer
	bindLogs(app, reg, &buf)

	// mimic the PocketBase logs writer: one transaction per batch, reusing
	// a single model for every entry
	err := app.AuxRunInTransaction(func(txApp core.App) error {
		l := &core.Log{}
		for _, msg := range []string{"GET /api/health", "POST /api/batch"} {
			l.MarkAsNew()
			l.Id = core.GenerateDefaultRandomId()
			l.Level = int(slog.LevelDebug)
			l.Message = msg
			l.Data = types.JSONMap[any]{"type": "request", "status": 200}
			if msg == "POST /api/batch" {
				l.Level = int(slog.LevelError)
				l.Data = types.JSONMap[any]{"error": "boom"}
			}
			l.Created, _ = types.ParseDateTime("2026-01-02 03:04:05.000Z")
			if err := txApp.AuxSave(l); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	lines := strings.Split(strings.TrimSpace(buf.String()), "\n")
	if len(lines) != 2 {
		t.Fatalf("want 2 json lines, got %q", buf.String())
	}
	for i, msg := range []string{"GET /api/health", "POST /api/batch"} {
		var line map[string]any
		if err := json.Unmarshal([]byte(lines[i]), &line); err != nil {
			t.Fatalf("not a json line: %q: %v", lines[i], err)
		}
		want := map[string]any{
			"time":   "2026-01-02T03:04:05Z",
			"level":  "DEBUG",
			"msg":    msg,
			"type":   "request",
			"status": float64(200),
		}
		if i == 1 {
			want = map[string]any{
				"time":  "2026-01-02T03:04:05Z",
				"level": "ERROR",
				"msg":   msg,
				"error": "boom",
			}
		}
		for k, v := range want {
			if line[k] != v {
				t.Errorf("line %d: %s = %v, want %v", i, k, line[k], v)
			}
		}
	}

	for _, c := range []struct {
		level, kind string
		want        float64
	}{
		{"DEBUG", "request", 1},
		{"ERROR", "app", 1},
		{"ERROR", "request", 0},
	} {
		labels := map[string]string{"level": c.level, "type": c.kind}
		if got := metricValue(t, reg, "gbp_log_entries_total", labels); got != c.want {
			t.Errorf("gbp_log_entries_total%v = %v, want %v", labels, got, c.want)
		}
	}
}

func TestMetricsHandlerToken(t *testing.T) {
	reg := prometheus.NewRegistry()
	reg.MustRegister(prometheus.NewCounter(prometheus.CounterOpts{Name: "gbp_test_total", Help: "test"}))
	h := metricsHandler("s3cret", reg)

	for _, s := range []struct {
		auth   string
		status int
	}{
		{"", http.StatusUnauthorized},
		{"Bearer nope", http.StatusUnauthorized},
		{"Bearer s3cret", http.StatusOK},
	} {
		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		if s.auth != "" {
			req.Header.Set("Authorization", s.auth)
		}
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != s.status {
			t.Errorf("auth %q: status %d, want %d", s.auth, rec.Code, s.status)
		}
		if s.status == http.StatusOK && !strings.Contains(rec.Body.String(), "gbp_test_total") {
			t.Errorf("metrics body missing the test counter")
		}
	}
}
