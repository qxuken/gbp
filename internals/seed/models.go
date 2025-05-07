package seed

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/internals/models"
)

type SeedItem interface {
	Seed(core.App) error
}

type DumpItem interface {
	Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error
}

type Icon []byte

func (item Icon) GoString() string {
	return "<icon>"
}

type Special struct {
	Id      string `db:"id"`
	Name    string `db:"name"`
	Substat bool   `db:"substat"`
	Order   int    `db:"order"`
}

func createSpecialsTable(db dbx.Builder) error {
	db.DropTable(models.SPECIALS_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.SPECIALS_COLLECTION_NAME, map[string]string{
		"id":      "TEXT not NULL PRIMARY KEY",
		"name":    "TEXT not NULL",
		"substat": "BOOL not NULL",
		"order":   "INTEGER not NULL",
	}).Execute()
	return err
}

func (item Special) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.SPECIALS_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	record.Set("substat", item.Substat)
	record.Set("order", item.Order)
	return app.Save(record)
}

func (item Special) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) (err error) {
	_, err = db.Insert(models.SPECIALS_COLLECTION_NAME, dbx.Params{
		"id":      record.Id,
		"name":    record.GetString("name"),
		"substat": record.GetBool("substat"),
		"order":   record.GetInt("order"),
	}).Execute()
	return err
}

type Element struct {
	Id               string `db:"id"`
	Name             string `db:"name"`
	Color            string `db:"color"`
	InverseTextColor bool   `db:"inverseTextColor"`
	IconContent      Icon   `db:"iconContent"`
	IconFilename     string `db:"iconFilename"`
}

func createElementsTable(db dbx.Builder) error {
	db.DropTable(models.ELEMENTS_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.ELEMENTS_COLLECTION_NAME, map[string]string{
		"id":               "TEXT not NULL PRIMARY KEY",
		"name":             "TEXT not NULL",
		"color":            "TEXT not NULL",
		"inverseTextColor": "BOOL not NULL",
		"iconFilename":     "TEXT not NULL",
		"iconContent":      "BLOB not NULL",
	}).Execute()
	return err
}

func (item Element) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.ELEMENTS_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	record.Set("color", item.Color)
	record.Set("inverseTextColor", item.InverseTextColor)
	file, err := filesystem.NewFileFromBytes(item.IconContent, item.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

func (item Element) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error {
	iconFilename, iconContent, err := getFileContent(fsys, record, "icon")
	if err != nil {
		return err
	}
	_, err = db.Insert(models.ELEMENTS_COLLECTION_NAME, dbx.Params{
		"id":               record.Id,
		"name":             record.GetString("name"),
		"color":            record.GetString("color"),
		"inverseTextColor": record.GetBool("inverseTextColor"),
		"iconFilename":     iconFilename,
		"iconContent":      iconContent,
	}).Execute()
	return err
}

type CharacterRole struct {
	Id   string `db:"id"`
	Name string `db:"name"`
}

func createCharacterRolesTable(db dbx.Builder) error {
	db.DropTable(models.CHARACTER_ROLES_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.CHARACTER_ROLES_COLLECTION_NAME, map[string]string{
		"id":   "TEXT not NULL PRIMARY KEY",
		"name": "TEXT not NULL",
	}).Execute()
	return err
}

func (item CharacterRole) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.CHARACTER_ROLES_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	return app.Save(record)
}

func (item CharacterRole) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error {
	_, err := db.Insert(models.CHARACTER_ROLES_COLLECTION_NAME, dbx.Params{
		"id":   record.Id,
		"name": record.GetString("name"),
	}).Execute()
	return err
}

type ArtifactSet struct {
	Id           string `db:"id"`
	Name         string `db:"name"`
	Rarity       string `db:"rarity"`
	IconFilename string `db:"iconFilename"`
	IconContent  Icon   `db:"iconContent"`
}

func createArtifactSetsTable(db dbx.Builder) error {
	db.DropTable(models.ARTIFACT_SETS_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.ARTIFACT_SETS_COLLECTION_NAME, map[string]string{
		"id":           "TEXT not NULL PRIMARY KEY",
		"name":         "TEXT not NULL",
		"rarity":       "TEXT not NULL",
		"iconFilename": "TEXT not NULL",
		"iconContent":  "BLOB not NULL",
	}).Execute()
	return err
}

func (item ArtifactSet) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.ARTIFACT_SETS_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	record.Set("rarity", item.Rarity)
	file, err := filesystem.NewFileFromBytes(item.IconContent, item.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

func (item ArtifactSet) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error {
	iconFilename, iconContent, err := getFileContent(fsys, record, "icon")
	if err != nil {
		return err
	}
	_, err = db.Insert(models.ARTIFACT_SETS_COLLECTION_NAME, dbx.Params{
		"id":           record.Id,
		"name":         record.GetString("name"),
		"rarity":       record.GetString("rarity"),
		"iconFilename": iconFilename,
		"iconContent":  iconContent,
	}).Execute()
	return err
}

type ArtifactType struct {
	Id           string                  `db:"id"`
	Name         string                  `db:"name"`
	Specials     types.JSONArray[string] `db:"specials"`
	Order        int                     `db:"order"`
	IconContent  Icon                    `db:"iconContent"`
	IconFilename string                  `db:"iconFilename"`
}

func createArtifactTypesTable(db dbx.Builder) error {
	db.DropTable(models.ARTIFACT_TYPES_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.ARTIFACT_TYPES_COLLECTION_NAME, map[string]string{
		"id":           "TEXT not NULL PRIMARY KEY",
		"name":         "TEXT not NULL",
		"specials":     "TEXT not NULL",
		"order":        "INTEGER not NULL",
		"iconFilename": "TEXT not NULL",
		"iconContent":  "BLOB not NULL",
	}).Execute()
	return err
}

func (item ArtifactType) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.ARTIFACT_TYPES_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	record.Set("specials", item.Specials)
	record.Set("order", item.Order)
	file, err := filesystem.NewFileFromBytes(item.IconContent, item.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

func (item ArtifactType) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error {
	iconFilename, iconContent, err := getFileContent(fsys, record, "icon")
	if err != nil {
		return err
	}
	specials, err := json.Marshal(record.GetStringSlice("specials"))
	if err != nil {
		return err
	}
	_, err = db.Insert(models.ARTIFACT_TYPES_COLLECTION_NAME, dbx.Params{
		"id":           record.Id,
		"name":         record.GetString("name"),
		"specials":     specials,
		"order":        record.GetInt("order"),
		"iconFilename": iconFilename,
		"iconContent":  iconContent,
	}).Execute()
	return err
}

type DomainOfBlessing struct {
	Id           string                  `db:"id"`
	Name         string                  `db:"name"`
	ArtifactSets types.JSONArray[string] `db:"artifactSets"`
}

func createDomainsOfBlessingTable(db dbx.Builder) error {
	db.DropTable(models.DOMAINS_OF_BLESSING_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.DOMAINS_OF_BLESSING_COLLECTION_NAME, map[string]string{
		"id":           "TEXT not NULL PRIMARY KEY",
		"name":         "TEXT not NULL",
		"artifactSets": "TEXT not NULL",
	}).Execute()
	return err
}

func (item DomainOfBlessing) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.DOMAINS_OF_BLESSING_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	record.Set("artifactSets", item.ArtifactSets)
	return app.Save(record)
}

func (item DomainOfBlessing) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error {
	artifactSets, err := json.Marshal(record.GetStringSlice("artifactSets"))
	if err != nil {
		return err
	}
	_, err = db.Insert(models.DOMAINS_OF_BLESSING_COLLECTION_NAME, dbx.Params{
		"id":           record.Id,
		"name":         record.GetString("name"),
		"artifactSets": artifactSets,
	}).Execute()
	return err
}

type WeaponType struct {
	Id           string `db:"id"`
	Name         string `db:"name"`
	IconContent  Icon   `db:"iconContent"`
	IconFilename string `db:"iconFilename"`
}

func createWeaponTypesTable(db dbx.Builder) error {
	db.DropTable(models.WEAPON_TYPES_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.WEAPON_TYPES_COLLECTION_NAME, map[string]string{
		"id":           "TEXT not NULL PRIMARY KEY",
		"name":         "TEXT not NULL",
		"iconFilename": "TEXT not NULL",
		"iconContent":  "BLOB not NULL",
	}).Execute()
	return err
}

func (item WeaponType) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.WEAPON_TYPES_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	file, err := filesystem.NewFileFromBytes(item.IconContent, item.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

func (item WeaponType) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error {
	iconFilename, iconContent, err := getFileContent(fsys, record, "icon")
	if err != nil {
		return err
	}
	_, err = db.Insert(models.WEAPON_TYPES_COLLECTION_NAME, dbx.Params{
		"id":           record.Id,
		"name":         record.GetString("name"),
		"iconFilename": iconFilename,
		"iconContent":  iconContent,
	}).Execute()
	return err
}

type Weapon struct {
	Id           string `db:"id"`
	Name         string `db:"name"`
	Rarity       int    `db:"rarity"`
	WeaponType   string `db:"weaponType"`
	Special      string `db:"special"`
	IconContent  Icon   `db:"iconContent"`
	IconFilename string `db:"iconFilename"`
}

func createWeaponsTable(db dbx.Builder) error {
	db.DropTable(models.WEAPONS_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.WEAPONS_COLLECTION_NAME, map[string]string{
		"id":           "TEXT not NULL PRIMARY KEY",
		"name":         "TEXT not NULL",
		"rarity":       "INTEGER not NULL",
		"weaponType":   "TEXT not NULL",
		"special":      "TEXT default ''",
		"iconFilename": "TEXT not NULL",
		"iconContent":  "BLOB not NULL",
	}).Execute()
	return err
}

func (item Weapon) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.WEAPONS_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	record.Set("rarity", item.Rarity)
	record.Set("weaponType", item.WeaponType)
	record.Set("special", item.Special)
	file, err := filesystem.NewFileFromBytes(item.IconContent, item.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

func (item Weapon) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error {
	iconFilename, iconContent, err := getFileContent(fsys, record, "icon")
	if err != nil {
		return err
	}
	_, err = db.Insert(models.WEAPONS_COLLECTION_NAME, dbx.Params{
		"id":           record.Id,
		"name":         record.GetString("name"),
		"rarity":       record.GetInt("rarity"),
		"weaponType":   record.GetString("weaponType"),
		"special":      record.GetString("special"),
		"iconFilename": iconFilename,
		"iconContent":  iconContent,
	}).Execute()
	return err
}

type Character struct {
	Id           string `db:"id"`
	Name         string `db:"name"`
	Rarity       int    `db:"rarity"`
	Element      string `db:"element"`
	WeaponType   string `db:"weaponType"`
	Special      string `db:"special"`
	IconContent  Icon   `db:"iconContent"`
	IconFilename string `db:"iconFilename"`
}

func createCharactersTable(db dbx.Builder) error {
	db.DropTable(models.CHARACTERS_COLLECTION_NAME).Execute()
	_, err := db.CreateTable(models.CHARACTERS_COLLECTION_NAME, map[string]string{
		"id":           "TEXT not NULL PRIMARY KEY",
		"name":         "TEXT not NULL",
		"rarity":       "INTEGER not NULL",
		"element":      "TEXT default ''",
		"weaponType":   "TEXT not NULL",
		"special":      "TEXT not NULL",
		"iconFilename": "TEXT not NULL",
		"iconContent":  "BLOB not NULL",
	}).Execute()
	return err
}

func (item Character) Seed(app core.App) error {
	record, err := upsertRecordById(app, models.CHARACTERS_COLLECTION_NAME, item.Id)
	if err != nil {
		return err
	}
	record.Set("name", item.Name)
	record.Set("rarity", item.Rarity)
	record.Set("element", item.Element)
	record.Set("weaponType", item.WeaponType)
	record.Set("special", item.Special)
	file, err := filesystem.NewFileFromBytes(item.IconContent, item.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

func (item Character) Dump(db dbx.Builder, fsys *filesystem.System, record *core.Record) error {
	iconFilename, iconContent, err := getFileContent(fsys, record, "icon")
	if err != nil {
		return err
	}
	_, err = db.Insert(models.CHARACTERS_COLLECTION_NAME, dbx.Params{
		"id":           record.Id,
		"name":         record.GetString("name"),
		"rarity":       record.GetInt("rarity"),
		"element":      record.GetString("element"),
		"weaponType":   record.GetString("weaponType"),
		"special":      record.GetString("special"),
		"iconFilename": iconFilename,
		"iconContent":  iconContent,
	}).Execute()
	return err
}
