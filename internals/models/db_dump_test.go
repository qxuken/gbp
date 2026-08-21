package models_test

import (
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/internals/testutil"
)

func TestMain(m *testing.M) {
	testutil.Main(m)
}

func TestFindLatestDbDump(t *testing.T) {
	app := testutil.NewTestApp(t)

	if _, err := models.FindLatestDbDump(app); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}

	testutil.CreateDbDump(t, app, "hash-old", "old notes")
	// the dumps are ordered by their creation timestamp, which has a ms precision
	time.Sleep(5 * time.Millisecond)
	testutil.CreateDbDump(t, app, "hash-new", "new notes")

	latest, err := models.FindLatestDbDump(app)
	if err != nil {
		t.Fatal(err)
	}
	if latest.Hash() != "hash-new" {
		t.Errorf("expected the newest dump, got %q", latest.Hash())
	}
	if latest.Notes() != "new notes" {
		t.Errorf("notes: expected %q, got %q", "new notes", latest.Notes())
	}
	if latest.DumpFilename() == "" {
		t.Error("expected a stored dump filename")
	}
	if latest.DumpPath(app) != latest.DumpDir(app)+"/"+latest.DumpFilename() {
		t.Errorf("unexpected dump path %q", latest.DumpPath(app))
	}
}

func TestFindDbDumpById(t *testing.T) {
	app := testutil.NewTestApp(t)
	created := testutil.CreateDbDump(t, app, "hash-by-id", "notes")

	found, err := models.FindDbDumpById(app, created.Id)
	if err != nil {
		t.Fatal(err)
	}
	if found.Hash() != "hash-by-id" {
		t.Errorf("hash: expected %q, got %q", "hash-by-id", found.Hash())
	}
	if _, err := models.FindDbDumpById(app, "missingdumpid00"); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}
}

func TestLatestDbDumpCache(t *testing.T) {
	app := testutil.NewTestApp(t)
	cache := models.NewLatestDbDumpCache()
	cache.Bind(app)

	if _, err := cache.Get(app); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected sql.ErrNoRows for an empty collection, got %v", err)
	}

	created := testutil.CreateDbDump(t, app, "hash-1", "first notes")

	latest, err := cache.Get(app)
	if err != nil {
		t.Fatal(err)
	}
	if latest.Hash() != "hash-1" {
		t.Fatalf("hash: expected %q, got %q", "hash-1", latest.Hash())
	}

	// a second call is served from the cache
	cached, err := cache.Get(app)
	if err != nil {
		t.Fatal(err)
	}
	if cached != latest {
		t.Error("expected the cached instance to be reused")
	}

	// a record update invalidates the cache
	created.Set("notes", "updated notes")
	if err := app.Save(created); err != nil {
		t.Fatal(err)
	}
	updated, err := cache.Get(app)
	if err != nil {
		t.Fatal(err)
	}
	if updated.Notes() != "updated notes" {
		t.Errorf("notes: expected %q, got %q", "updated notes", updated.Notes())
	}

	// a newly created dump becomes the cached one
	time.Sleep(5 * time.Millisecond)
	testutil.CreateDbDump(t, app, "hash-2", "second notes")
	latest, err = cache.Get(app)
	if err != nil {
		t.Fatal(err)
	}
	if latest.Hash() != "hash-2" {
		t.Errorf("hash: expected %q, got %q", "hash-2", latest.Hash())
	}

	// deleting it falls back to the previous one
	if err := app.Delete(latest.Record); err != nil {
		t.Fatal(err)
	}
	latest, err = cache.Get(app)
	if err != nil {
		t.Fatal(err)
	}
	if latest.Hash() != "hash-1" {
		t.Errorf("hash: expected %q, got %q", "hash-1", latest.Hash())
	}

	// and deleting the last one empties the cache again
	if err := app.Delete(latest.Record); err != nil {
		t.Fatal(err)
	}
	if _, err := cache.Get(app); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}
}

func TestLatestDbDumpCacheInvalidate(t *testing.T) {
	app := testutil.NewTestApp(t)
	cache := models.NewLatestDbDumpCache()
	// no Bind here, the cache is only refreshed explicitly
	testutil.CreateDbDump(t, app, "hash-1", "notes")

	first, err := cache.Get(app)
	if err != nil {
		t.Fatal(err)
	}

	time.Sleep(5 * time.Millisecond)
	testutil.CreateDbDump(t, app, "hash-2", "notes")

	stale, err := cache.Get(app)
	if err != nil {
		t.Fatal(err)
	}
	if stale != first {
		t.Error("expected the unbound cache to keep serving the loaded dump")
	}

	cache.Invalidate()
	latest, err := cache.Get(app)
	if err != nil {
		t.Fatal(err)
	}
	if latest.Hash() != "hash-2" {
		t.Errorf("hash: expected %q, got %q", "hash-2", latest.Hash())
	}
}
