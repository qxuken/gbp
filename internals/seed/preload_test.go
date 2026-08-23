package seed_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/pocketbase/pocketbase/core"

	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/internals/seed"
	"github.com/qxuken/gbp/internals/testutil"
)

// writePreload builds a seed file from a populated app and lays it out as the
// seed.db/seed.hash/seed.note trio next to the binary, i.e. in the working
// directory UpdateFromPreload reads from.
func writePreload(t testing.TB, notes string) string {
	t.Helper()

	source := testutil.NewTestApp(t)
	testutil.SeedDictionaries(t, source)

	built := filepath.Join(t.TempDir(), "built.db")
	if err := seed.Dump(source, built, notes); err != nil {
		t.Fatalf("dump: %v", err)
	}
	content, err := os.ReadFile(built)
	if err != nil {
		t.Fatal(err)
	}
	hash, err := seed.GetSeedHash(built)
	if err != nil {
		t.Fatal(err)
	}

	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, seed.PRELOAD_SEED_FILE), content, 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, seed.PRELOAD_SEED_HASH), []byte(hash), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, seed.PRELOAD_SEED_NOTE), []byte(notes), 0644); err != nil {
		t.Fatal(err)
	}
	t.Chdir(dir)

	return hash
}

func countDumps(t testing.TB, app core.App) int {
	t.Helper()
	records, err := app.FindRecordsByFilter(models.DB_DUMPS_COLLECTION_NAME, "", "", 0, 0)
	if err != nil {
		t.Fatalf("dumps: %v", err)
	}
	return len(records)
}

func dictionaryVersion(t testing.TB, app core.App) string {
	t.Helper()
	setting, err := models.FindAppSettingsByKey(app, "dictionaryVersion")
	if err != nil {
		t.Fatalf("dictionaryVersion: %v", err)
	}
	return setting.Value()
}

// TestUpdateFromPreloadAppliesSeed covers the first boot: nothing in the db yet,
// so the bundled seed is stored and applied.
func TestUpdateFromPreloadAppliesSeed(t *testing.T) {
	hash := writePreload(t, "preload notes")
	app := testutil.NewTestApp(t)

	if err := seed.UpdateFromPreload(app); err != nil {
		t.Fatalf("update from preload: %v", err)
	}

	if got := dictionaryVersion(t, app); got != hash {
		t.Errorf("dictionaryVersion: expected %q, got %q", hash, got)
	}
	if got := countDumps(t, app); got != 1 {
		t.Errorf("dumps: expected 1, got %d", got)
	}
	characters, err := app.FindRecordsByFilter(models.CHARACTERS_COLLECTION_NAME, "", "", 0, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(characters) != 1 {
		t.Errorf("characters: expected the seed to be applied, got %d records", len(characters))
	}
}

// TestUpdateFromPreloadSkipsMatchingDictionaryVersion covers a plain restart:
// the collections already hold the bundled dictionary.
func TestUpdateFromPreloadSkipsMatchingDictionaryVersion(t *testing.T) {
	hash := writePreload(t, "preload notes")
	app := testutil.NewTestApp(t)
	if _, err := models.UpsertAppSettings(app, "dictionaryVersion", hash); err != nil {
		t.Fatal(err)
	}

	if err := seed.UpdateFromPreload(app); err != nil {
		t.Fatalf("update from preload: %v", err)
	}

	if got := countDumps(t, app); got != 0 {
		t.Errorf("dumps: expected the preload to be skipped, got %d", got)
	}
}

// TestUpdateFromPreloadSkipsAlreadyStoredSeed covers a restart after the
// dictionary moved on: the bundled seed is stored but is no longer the latest
// dump, so re-applying it would roll the dictionary back.
func TestUpdateFromPreloadSkipsAlreadyStoredSeed(t *testing.T) {
	hash := writePreload(t, "preload notes")
	app := testutil.NewTestApp(t)

	if err := seed.SaveDump(app, seed.PRELOAD_SEED_FILE, "preload notes"); err != nil {
		t.Fatalf("save preload dump: %v", err)
	}
	newer := filepath.Join(t.TempDir(), "newer.db")
	if err := os.WriteFile(newer, []byte("a newer dictionary"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := seed.SaveDump(app, newer, "newer notes"); err != nil {
		t.Fatalf("save newer dump: %v", err)
	}
	newerHash, err := seed.GetSeedHash(newer)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := models.UpsertAppSettings(app, "dictionaryVersion", newerHash); err != nil {
		t.Fatal(err)
	}

	if err := seed.UpdateFromPreload(app); err != nil {
		t.Fatalf("update from preload: %v", err)
	}

	if got := countDumps(t, app); got != 2 {
		t.Errorf("dumps: expected the preload to be skipped, got %d", got)
	}
	if got := dictionaryVersion(t, app); got != newerHash {
		t.Errorf("dictionaryVersion: expected the newer %q to survive, got %q", newerHash, got)
	}
	if hash == newerHash {
		t.Fatal("the preload and the newer dump should not share a hash")
	}
}
