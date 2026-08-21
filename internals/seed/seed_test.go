package seed_test

import (
	"bytes"
	"os"
	"path"
	"path/filepath"
	"testing"

	"github.com/pocketbase/pocketbase/core"

	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/internals/seed"
	"github.com/qxuken/gbp/internals/testutil"
)

func TestMain(m *testing.M) {
	testutil.Main(m)
}

func fileContent(t testing.TB, app core.App, record *core.Record, field string) []byte {
	t.Helper()
	fsys, err := app.NewFilesystem()
	if err != nil {
		t.Fatal(err)
	}
	defer fsys.Close()

	r, err := fsys.GetReader(path.Join(record.BaseFilesPath(), record.GetString(field)))
	if err != nil {
		t.Fatalf("%s.%s: %v", record.Collection().Name, field, err)
	}
	defer r.Close()

	buf := make([]byte, r.Size())
	if _, err := r.Read(buf); err != nil {
		t.Fatal(err)
	}
	return buf
}

// TestDumpSeedRoundTrip dumps a populated app into a standalone seed file and
// seeds it back into an empty one, which covers both directions of the
// reflection driven mapping in internals/seed.
func TestDumpSeedRoundTrip(t *testing.T) {
	source := testutil.NewTestApp(t)
	testutil.SeedDictionaries(t, source)

	dumpPath := filepath.Join(t.TempDir(), "seed.db")
	if err := seed.Dump(source, dumpPath, "round trip notes"); err != nil {
		t.Fatalf("dump: %v", err)
	}
	if _, err := os.Stat(dumpPath); err != nil {
		t.Fatalf("dump file: %v", err)
	}

	target := testutil.NewTestApp(t)
	if err := seed.Seed(target, dumpPath); err != nil {
		t.Fatalf("seed: %v", err)
	}

	expectedCounts := map[string]int{
		models.SPECIALS_COLLECTION_NAME:            2,
		models.ELEMENTS_COLLECTION_NAME:            1,
		models.CHARACTER_ROLES_COLLECTION_NAME:     1,
		models.PATCH_COLLECTION_NAME:               1,
		models.WEAPON_TYPES_COLLECTION_NAME:        1,
		models.ARTIFACT_SETS_COLLECTION_NAME:       1,
		models.ARTIFACT_TYPES_COLLECTION_NAME:      1,
		models.DOMAINS_OF_BLESSING_COLLECTION_NAME: 1,
		models.WEAPONS_COLLECTION_NAME:             1,
		models.CHARACTERS_COLLECTION_NAME:          1,
	}
	for collectionName, expected := range expectedCounts {
		records, err := target.FindAllRecords(collectionName)
		if err != nil {
			t.Fatalf("%s: %v", collectionName, err)
		}
		if len(records) != expected {
			t.Errorf("%s: expected %d records, got %d", collectionName, expected, len(records))
		}
	}

	character, err := target.FindRecordById(models.CHARACTERS_COLLECTION_NAME, "characterdiluc0")
	if err != nil {
		t.Fatalf("character: %v", err)
	}
	if v := character.GetString("name"); v != "Diluc" {
		t.Errorf("character name: expected %q, got %q", "Diluc", v)
	}
	if v := character.GetInt("rarity"); v != 5 {
		t.Errorf("character rarity: expected 5, got %d", v)
	}
	for field, expected := range map[string]string{
		"element":    "elementpyro0000",
		"weaponType": "weapontypesword",
		"special":    "spcritrate00000",
		"patch":      "patch5dot100000",
	} {
		if v := character.GetString(field); v != expected {
			t.Errorf("character %s: expected %q, got %q", field, expected, v)
		}
	}

	element, err := target.FindRecordById(models.ELEMENTS_COLLECTION_NAME, "elementpyro0000")
	if err != nil {
		t.Fatalf("element: %v", err)
	}
	if !element.GetBool("inverseTextColor") {
		t.Error("element inverseTextColor: expected true")
	}
	// the dumped icon is renamed after the record name, PocketBase then adds its own suffix
	if name := element.GetString("icon"); !bytes.HasPrefix([]byte(name), []byte("pyro")) {
		t.Errorf("element icon: expected a pyro*.png name, got %q", name)
	}
	if content := fileContent(t, target, element, "icon"); !bytes.Equal(content, testutil.PngContent) {
		t.Errorf("element icon: content mismatch (%d bytes)", len(content))
	}

	// json backed relation lists keep their order
	artifactType, err := target.FindRecordById(models.ARTIFACT_TYPES_COLLECTION_NAME, "arttypeflower00")
	if err != nil {
		t.Fatalf("artifact type: %v", err)
	}
	specials := artifactType.GetStringSlice("specials")
	if len(specials) != 2 || specials[0] != "spcritrate00000" || specials[1] != "spatkpercent000" {
		t.Errorf("artifact type specials: unexpected %v", specials)
	}

	domain, err := target.FindRecordById(models.DOMAINS_OF_BLESSING_COLLECTION_NAME, "domainofvalor00")
	if err != nil {
		t.Fatalf("domain: %v", err)
	}
	if sets := domain.GetStringSlice("artifactSets"); len(sets) != 1 || sets[0] != "artsetgladiator" {
		t.Errorf("domain artifactSets: unexpected %v", sets)
	}

	hash, err := seed.GetSeedHash(dumpPath)
	if err != nil {
		t.Fatal(err)
	}
	dictionaryVersion, err := models.FindAppSettingsByKey(target, "dictionaryVersion")
	if err != nil {
		t.Fatalf("dictionaryVersion: %v", err)
	}
	if dictionaryVersion.Value() != hash {
		t.Errorf("dictionaryVersion: expected %q, got %q", hash, dictionaryVersion.Value())
	}
}

// TestDumpSavesDumpRecord checks that dumping also stores the file as a _dbDumps record.
func TestDumpSavesDumpRecord(t *testing.T) {
	app := testutil.NewTestApp(t)
	testutil.SeedDictionaries(t, app)

	dumpPath := filepath.Join(t.TempDir(), "seed.db")
	if err := seed.Dump(app, dumpPath, "with notes"); err != nil {
		t.Fatalf("dump: %v", err)
	}

	dump, err := models.FindLatestDbDump(app)
	if err != nil {
		t.Fatalf("latest dump: %v", err)
	}
	hash, err := seed.GetSeedHash(dumpPath)
	if err != nil {
		t.Fatal(err)
	}
	if dump.Hash() != hash {
		t.Errorf("dump hash: expected %q, got %q", hash, dump.Hash())
	}
	if dump.Notes() != "with notes" {
		t.Errorf("dump notes: expected %q, got %q", "with notes", dump.Notes())
	}
	if _, err := os.Stat(dump.DumpPath(app)); err != nil {
		t.Errorf("stored dump file: %v", err)
	}
}

func TestGetSeedHash(t *testing.T) {
	dir := t.TempDir()
	first := filepath.Join(dir, "first")
	second := filepath.Join(dir, "second")
	if err := os.WriteFile(first, []byte("seed content"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(second, []byte("other content"), 0644); err != nil {
		t.Fatal(err)
	}

	hash, err := seed.GetSeedHash(first)
	if err != nil {
		t.Fatal(err)
	}
	if len(hash) != 64 {
		t.Errorf("hash: expected a 64 char sha256, got %q", hash)
	}
	same, err := seed.GetSeedHash(first)
	if err != nil {
		t.Fatal(err)
	}
	if same != hash {
		t.Errorf("hash is not stable: %q != %q", same, hash)
	}
	other, err := seed.GetSeedHash(second)
	if err != nil {
		t.Fatal(err)
	}
	if other == hash {
		t.Error("different files produced the same hash")
	}
	if _, err := seed.GetSeedHash(filepath.Join(dir, "missing")); err == nil {
		t.Error("expected an error for a missing file")
	}
}
