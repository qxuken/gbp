// Package testutil provides helpers for spinning up PocketBase test apps
// with the project migrations applied.
//
// See https://pocketbase.io/docs/go-testing/ for the underlying tooling.
package testutil

import (
	"fmt"
	"os"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
	"github.com/pocketbase/pocketbase/tools/filesystem"

	"github.com/qxuken/gbp/internals/models"
	_ "github.com/qxuken/gbp/migrations"
)

const encryptionEnv = "pb_test_env"

// fixtureDir holds an empty data dir with every migration applied.
// It is built once per test binary in Main and cloned for each test app.
var fixtureDir string

// Main builds the shared migrated data dir, runs the package tests and
// cleans the fixture up afterwards.
//
// Use it as the package TestMain:
//
//	func TestMain(m *testing.M) { testutil.Main(m) }
func Main(m *testing.M) {
	dir, err := buildFixtureDir()
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to prepare the test data dir:", err)
		os.Exit(1)
	}
	fixtureDir = dir
	code := m.Run()
	os.RemoveAll(dir)
	os.Exit(code)
}

// buildFixtureDir bootstraps an empty data dir and applies all migrations to it.
//
// The data dir bundled with the PocketBase tests package can't be reused here
// because its demo collections collide with the project ones (e.g. "users").
func buildFixtureDir() (string, error) {
	dir, err := os.MkdirTemp("", "gbp_test_data_*")
	if err != nil {
		return "", err
	}
	app := core.NewBaseApp(core.BaseAppConfig{
		DataDir:       dir,
		EncryptionEnv: encryptionEnv,
	})
	if err := app.Bootstrap(); err != nil {
		os.RemoveAll(dir)
		return "", err
	}
	if err := app.RunAllMigrations(); err != nil {
		app.ResetBootstrapState()
		os.RemoveAll(dir)
		return "", err
	}
	// flush and close the db connections so that the dir can be cloned
	if err := app.ResetBootstrapState(); err != nil {
		os.RemoveAll(dir)
		return "", err
	}
	return dir, nil
}

// NewTestApp returns a test app working on its own clone of the migrated data dir.
//
// The app is cleaned up automatically at the end of the test.
func NewTestApp(t testing.TB) *tests.TestApp {
	t.Helper()
	app := NewTestAppWithoutCleanup(t)
	t.Cleanup(app.Cleanup)
	return app
}

// NewTestAppWithoutCleanup is the same as NewTestApp, but leaves the cleanup to
// the caller (e.g. tests.ApiScenario cleans up the app it was given on its own).
func NewTestAppWithoutCleanup(t testing.TB) *tests.TestApp {
	t.Helper()
	if fixtureDir == "" {
		t.Fatal("missing test data dir, did you forget to call testutil.Main from TestMain?")
	}
	app, err := tests.NewTestAppWithConfig(core.BaseAppConfig{
		DataDir:       fixtureDir,
		EncryptionEnv: encryptionEnv,
	})
	if err != nil {
		t.Fatal(err)
	}
	return app
}

// CreateDbDump stores a dump record with the given hash and notes.
func CreateDbDump(t testing.TB, app core.App, hash string, notes string) *models.DbDump {
	t.Helper()
	collection, err := app.FindCollectionByNameOrId(models.DB_DUMPS_COLLECTION_NAME)
	if err != nil {
		t.Fatal(err)
	}
	file, err := filesystem.NewFileFromBytes([]byte("dump content "+hash), hash+".db")
	if err != nil {
		t.Fatal(err)
	}
	record := core.NewRecord(collection)
	record.Set("hash", hash)
	record.Set("notes", notes)
	record.Set("dump", file)
	if err := app.Save(record); err != nil {
		t.Fatalf("save dump %q: %v", hash, err)
	}
	dump := &models.DbDump{}
	dump.SetProxyRecord(record)
	return dump
}
