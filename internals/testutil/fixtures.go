package testutil

import (
	"encoding/base64"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"

	"github.com/qxuken/gbp/internals/models"
)

// PngContent is the smallest valid 1x1 png, used as the dictionary icons content.
var PngContent = mustDecodeBase64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")

func mustDecodeBase64(v string) []byte {
	b, err := base64.StdEncoding.DecodeString(v)
	if err != nil {
		panic(err)
	}
	return b
}

func icon(t testing.TB, name string) *filesystem.File {
	t.Helper()
	file, err := filesystem.NewFileFromBytes(PngContent, name)
	if err != nil {
		t.Fatal(err)
	}
	return file
}

// CreateRecord saves a record with the given id and data.
func CreateRecord(t testing.TB, app core.App, collectionName string, id string, data map[string]any) *core.Record {
	t.Helper()
	collection, err := app.FindCollectionByNameOrId(collectionName)
	if err != nil {
		t.Fatalf("%s: %v", collectionName, err)
	}
	record := core.NewRecord(collection)
	record.Set("id", id)
	for k, v := range data {
		record.Set(k, v)
	}
	if err := app.Save(record); err != nil {
		t.Fatalf("%s %q: %v", collectionName, id, err)
	}
	return record
}

// SeedDictionaries fills every dictionary collection with a single item
// (two for specials, so that the json relation lists are not trivial).
func SeedDictionaries(t testing.TB, app core.App) {
	t.Helper()

	CreateRecord(t, app, models.SPECIALS_COLLECTION_NAME, "spcritrate00000", map[string]any{
		"name": "Crit Rate", "order": 1, "substat": true,
	})
	CreateRecord(t, app, models.SPECIALS_COLLECTION_NAME, "spatkpercent000", map[string]any{
		"name": "ATK%", "order": 2, "substat": false,
	})
	CreateRecord(t, app, models.ELEMENTS_COLLECTION_NAME, "elementpyro0000", map[string]any{
		"name": "Pyro", "color": "#ff5722", "inverseTextColor": true, "icon": icon(t, "pyro.png"),
	})
	CreateRecord(t, app, models.CHARACTER_ROLES_COLLECTION_NAME, "charrolemaindps", map[string]any{
		"name": "Main DPS",
	})
	CreateRecord(t, app, models.PATCH_COLLECTION_NAME, "patch5dot100000", map[string]any{
		"major": 5, "patch": 1,
	})
	CreateRecord(t, app, models.WEAPON_TYPES_COLLECTION_NAME, "weapontypesword", map[string]any{
		"name": "Sword", "icon": icon(t, "sword.png"),
	})
	CreateRecord(t, app, models.ARTIFACT_SETS_COLLECTION_NAME, "artsetgladiator", map[string]any{
		"name": "Gladiator's Finale", "rarity": 5, "patch": "patch5dot100000",
		"useless": false, "icon": icon(t, "gladiator.png"),
	})
	CreateRecord(t, app, models.ARTIFACT_TYPES_COLLECTION_NAME, "arttypeflower00", map[string]any{
		"name": "Flower of Life", "order": 1, "icon": icon(t, "flower.png"),
		"specials": []string{"spcritrate00000", "spatkpercent000"},
	})
	CreateRecord(t, app, models.DOMAINS_OF_BLESSING_COLLECTION_NAME, "domainofvalor00", map[string]any{
		"name": "Domain of Valor", "artifactSets": []string{"artsetgladiator"},
	})
	CreateRecord(t, app, models.WEAPONS_COLLECTION_NAME, "weaponaquila000", map[string]any{
		"name": "Aquila Favonia", "rarity": 5, "weaponType": "weapontypesword",
		"special": "spatkpercent000", "patch": "patch5dot100000", "useless": false,
		"icon": icon(t, "aquila.png"),
	})
	CreateRecord(t, app, models.CHARACTERS_COLLECTION_NAME, "characterdiluc0", map[string]any{
		"name": "Diluc", "rarity": 5, "element": "elementpyro0000",
		"weaponType": "weapontypesword", "special": "spcritrate00000",
		"patch": "patch5dot100000", "icon": icon(t, "diluc.png"),
	})
}
