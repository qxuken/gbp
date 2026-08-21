package api_test

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"

	"github.com/qxuken/gbp/internals/api"
	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/internals/seed"
	"github.com/qxuken/gbp/internals/testutil"
)

func TestMain(m *testing.M) {
	testutil.Main(m)
}

// testApp returns an ApiScenario factory serving the custom routes, with an
// optional setup step running before the request.
func testApp(setup func(t testing.TB, app *tests.TestApp)) func(t testing.TB) *tests.TestApp {
	return func(t testing.TB) *tests.TestApp {
		app := testutil.NewTestAppWithoutCleanup(t)
		latestDumpCache := models.NewLatestDbDumpCache()
		latestDumpCache.Bind(app)
		api.Bind(app, latestDumpCache)
		if setup != nil {
			setup(t, app)
		}
		return app
	}
}

func TestPlansCollections(t *testing.T) {
	scenario := tests.ApiScenario{
		Name:           "plans collections dictionary",
		Method:         http.MethodGet,
		URL:            "/api/plansCollections",
		ExpectedStatus: http.StatusOK,
		ExpectedContent: []string{
			`"name":"characterPlans"`,
			`"name":"weaponPlans"`,
			`"name":"artifactSetsPlans"`,
			`"name":"artifactTypePlans"`,
			`"name":"teamPlans"`,
		},
		TestAppFactory: testApp(nil),
	}
	scenario.Test(t)
}

func TestDictionaryVersion(t *testing.T) {
	scenarios := []tests.ApiScenario{
		{
			Name:            "existing dictionary version",
			Method:          http.MethodGet,
			URL:             "/api/dictionaryVersion",
			ExpectedStatus:  http.StatusOK,
			ExpectedContent: []string{`"version-hash"`},
			TestAppFactory: testApp(func(t testing.TB, app *tests.TestApp) {
				if _, err := models.UpsertAppSettings(app, "dictionaryVersion", "version-hash"); err != nil {
					t.Fatal(err)
				}
			}),
		},
		{
			Name:            "missing dictionary version",
			Method:          http.MethodGet,
			URL:             "/api/dictionaryVersion",
			ExpectedStatus:  http.StatusNotFound,
			ExpectedContent: []string{`"status":404`},
			TestAppFactory:  testApp(nil),
		},
	}
	for _, scenario := range scenarios {
		scenario.Test(t)
	}
}

func TestLatestDump(t *testing.T) {
	scenarios := []tests.ApiScenario{
		{
			Name:            "no dumps",
			Method:          http.MethodGet,
			URL:             "/api/dump/latest",
			ExpectedStatus:  http.StatusNotFound,
			ExpectedContent: []string{`"status":404`},
			TestAppFactory:  testApp(nil),
		},
		{
			Name:           "latest dump hash and notes",
			Method:         http.MethodGet,
			URL:            "/api/dump/latest",
			ExpectedStatus: http.StatusOK,
			ExpectedContent: []string{
				`"hash":"latest-hash"`,
				`"notes":"latest notes"`,
			},
			TestAppFactory: testApp(func(t testing.TB, app *tests.TestApp) {
				testutil.CreateDbDump(t, app, "latest-hash", "latest notes")
			}),
		},
		{
			Name:            "no dump file to download",
			Method:          http.MethodGet,
			URL:             "/api/dump/latest_seed.db",
			ExpectedStatus:  http.StatusNotFound,
			ExpectedContent: []string{`"status":404`},
			TestAppFactory:  testApp(nil),
		},
		{
			Name:            "download the latest dump file",
			Method:          http.MethodGet,
			URL:             "/api/dump/latest_seed.db",
			ExpectedStatus:  http.StatusOK,
			ExpectedContent: []string{"dump content latest-hash"},
			TestAppFactory: testApp(func(t testing.TB, app *tests.TestApp) {
				testutil.CreateDbDump(t, app, "latest-hash", "latest notes")
			}),
		},
	}
	for _, scenario := range scenarios {
		scenario.Test(t)
	}
}

// TestLatestDumpCacheRefresh checks that the cached response follows the dumps
// collection changes without restarting the app.
func TestLatestDumpCacheRefresh(t *testing.T) {
	app := testutil.NewTestApp(t)
	latestDumpCache := models.NewLatestDbDumpCache()
	latestDumpCache.Bind(app)
	api.Bind(app, latestDumpCache)

	mux := buildMux(t, app)
	get := func(url string) (int, string) {
		t.Helper()
		recorder := httptest.NewRecorder()
		mux.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, url, nil))
		return recorder.Code, recorder.Body.String()
	}

	if status, body := get("/api/dump/latest"); status != http.StatusNotFound {
		t.Fatalf("expected 404 without dumps, got %d %s", status, body)
	}

	testutil.CreateDbDump(t, app, "first-hash", "first notes")
	status, body := get("/api/dump/latest")
	if status != http.StatusOK || !strings.Contains(body, `"hash":"first-hash"`) {
		t.Fatalf("expected the first dump, got %d %s", status, body)
	}

	time.Sleep(5 * time.Millisecond)
	testutil.CreateDbDump(t, app, "second-hash", "second notes")
	status, body = get("/api/dump/latest")
	if status != http.StatusOK || !strings.Contains(body, `"hash":"second-hash"`) {
		t.Fatalf("expected the cache to follow the new dump, got %d %s", status, body)
	}
}

// buildMux triggers the serve event and returns the resulting http handler.
func buildMux(t testing.TB, app *tests.TestApp) http.Handler {
	t.Helper()
	baseRouter, err := apis.NewRouter(app)
	if err != nil {
		t.Fatal(err)
	}
	serveEvent := new(core.ServeEvent)
	serveEvent.App = app
	serveEvent.Router = baseRouter
	if err := app.OnServe().Trigger(serveEvent, func(e *core.ServeEvent) error { return nil }); err != nil {
		t.Fatal(err)
	}
	mux, err := serveEvent.Router.BuildMux()
	if err != nil {
		t.Fatal(err)
	}
	return mux
}

func TestDumpRoutesRequireSuperuser(t *testing.T) {
	scenarios := []tests.ApiScenario{
		{
			Name:            "generate",
			Method:          http.MethodPost,
			URL:             "/api/dump/generate",
			Body:            strings.NewReader(`{"notes":"nope"}`),
			Headers:         map[string]string{"Content-Type": "application/json"},
			ExpectedStatus:  http.StatusUnauthorized,
			ExpectedContent: []string{`"status":401`},
			TestAppFactory:  testApp(nil),
		},
		{
			Name:            "upload",
			Method:          http.MethodPost,
			URL:             "/api/dump/upload",
			ExpectedStatus:  http.StatusUnauthorized,
			ExpectedContent: []string{`"status":401`},
			TestAppFactory:  testApp(nil),
		},
		{
			Name:            "restore",
			Method:          http.MethodPost,
			URL:             "/api/dump/restore/somedumpid0000",
			ExpectedStatus:  http.StatusUnauthorized,
			ExpectedContent: []string{`"status":401`},
			TestAppFactory:  testApp(nil),
		},
	}
	for _, scenario := range scenarios {
		scenario.Test(t)
	}
}

// TestDumpUpload uploads a seed file through the superuser endpoint and checks
// that it is both stored as a dump and applied to the app.
func TestDumpUpload(t *testing.T) {
	// build a valid seed file out of a throwaway app
	source := testutil.NewTestApp(t)
	testutil.SeedDictionaries(t, source)
	dumpPath := filepath.Join(t.TempDir(), "seed.db")
	if err := seed.Dump(source, dumpPath, "uploaded"); err != nil {
		t.Fatal(err)
	}
	dumpContent, err := os.ReadFile(dumpPath)
	if err != nil {
		t.Fatal(err)
	}

	body := new(bytes.Buffer)
	form := multipart.NewWriter(body)
	if err := form.WriteField("notes", "uploaded notes"); err != nil {
		t.Fatal(err)
	}
	part, err := form.CreateFormFile("dump", "seed.db")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write(dumpContent); err != nil {
		t.Fatal(err)
	}
	if err := form.Close(); err != nil {
		t.Fatal(err)
	}

	// the superuser only exists once the factory built the app, so the request
	// header is filled in just before the request is sent
	headers := map[string]string{"Content-Type": form.FormDataContentType()}
	scenario := tests.ApiScenario{
		Name:            "upload a seed file",
		Method:          http.MethodPost,
		URL:             "/api/dump/upload",
		Body:            body,
		Headers:         headers,
		ExpectedStatus:  http.StatusOK,
		ExpectedContent: []string{`"status":"ok"`},
		TestAppFactory: testApp(func(t testing.TB, app *tests.TestApp) {
			t.Cleanup(app.Cleanup)
			headers["Authorization"] = superuserToken(t, app)
		}),
		DisableTestAppCleanup: true,
		AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
			dump, err := models.FindLatestDbDump(app)
			if err != nil {
				t.Fatalf("stored dump: %v", err)
			}
			if dump.Notes() != "uploaded notes" {
				t.Errorf("notes: expected %q, got %q", "uploaded notes", dump.Notes())
			}
			characters, err := app.FindAllRecords(models.CHARACTERS_COLLECTION_NAME)
			if err != nil {
				t.Fatal(err)
			}
			if len(characters) != 1 {
				t.Errorf("expected the upload to be applied, got %d characters", len(characters))
			}
		},
	}
	scenario.Test(t)
}

func superuserToken(t testing.TB, app *tests.TestApp) string {
	t.Helper()
	collection, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
	if err != nil {
		t.Fatal(err)
	}
	record := core.NewRecord(collection)
	record.SetEmail("superuser@test.com")
	record.SetPassword("testtest")
	if err := app.Save(record); err != nil {
		t.Fatal(err)
	}
	token, err := record.NewAuthToken()
	if err != nil {
		t.Fatal(err)
	}
	return token
}
