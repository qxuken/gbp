package seed

import (
	_ "github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/internals/models"
)

type SeedItem interface {
	Save(core.App) error
}

type Icon []byte

func (s Icon) GoString() string {
	return "<icon>"
}

type Special struct {
	Name    string `db:"name"`
	Substat int    `db:"substat"`
	Order   int    `db:"order"`
}

func (s Special) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.SPECIALS_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	record.Set("substat", s.Substat)
	record.Set("order", s.Order)
	return app.Save(record)
}

type Element struct {
	Name             string `db:"name"`
	Color            string `db:"color"`
	InverseTextColor bool   `db:"inverseTextColor"`
	IconContent      Icon   `db:"iconContent"`
	IconFilename     string `db:"iconFilename"`
}

func (s Element) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.ELEMENTS_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	record.Set("color", s.Color)
	record.Set("inverseTextColor", s.InverseTextColor)
	file, err := filesystem.NewFileFromBytes(s.IconContent, s.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

type CharacterRole struct {
	Name string `db:"name"`
}

func (s CharacterRole) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.CHARACTER_ROLES_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	return app.Save(record)
}

type ArtifactSet struct {
	Name         string `db:"name"`
	Rarity       string `db:"rarity"`
	IconContent  Icon   `db:"iconContent"`
	IconFilename string `db:"iconFilename"`
}

func (s ArtifactSet) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.ARTIFACT_SETS_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	record.Set("rarity", s.Rarity)
	file, err := filesystem.NewFileFromBytes(s.IconContent, s.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

type ArtifactType struct {
	Name         string                  `db:"name"`
	Specials     types.JSONArray[string] `db:"specials"`
	Order        int                     `db:"order"`
	IconContent  Icon                    `db:"iconContent"`
	IconFilename string                  `db:"iconFilename"`
}

func (s ArtifactType) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.ARTIFACT_TYPES_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	specials := []string{}
	for _, spec := range s.Specials {
		special, err := app.FindFirstRecordByData(models.SPECIALS_COLLECTION_NAME, "name", spec)
		if err != nil {
			return err
		}
		specials = append(specials, special.Id)
	}
	record.Set("specials", specials)
	record.Set("order", s.Order)
	file, err := filesystem.NewFileFromBytes(s.IconContent, s.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

type DomainOfBlessing struct {
	Name         string                  `db:"name"`
	ArtifactSets types.JSONArray[string] `db:"artifactSets"`
}

func (s DomainOfBlessing) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.DOMAINS_OF_BLESSING_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	specials := []string{}
	for _, set := range s.ArtifactSets {
		special, err := app.FindFirstRecordByData(models.ARTIFACT_SETS_COLLECTION_NAME, "name", set)
		if err != nil {
			return err
		}
		specials = append(specials, special.Id)
	}
	record.Set("artifactSets", specials)
	return app.Save(record)
}

type WeaponType struct {
	Name         string `db:"name"`
	IconContent  Icon   `db:"iconContent"`
	IconFilename string `db:"iconFilename"`
}

func (s WeaponType) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.WEAPON_TYPES_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	file, err := filesystem.NewFileFromBytes(s.IconContent, s.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

type Weapon struct {
	Name         string  `db:"name"`
	Rarity       int     `db:"rarity"`
	Type         string  `db:"type"`
	Special      *string `db:"special"`
	IconContent  Icon    `db:"iconContent"`
	IconFilename string  `db:"iconFilename"`
}

func (s Weapon) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.WEAPONS_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	record.Set("rarity", s.Rarity)
	weaponType, err := app.FindFirstRecordByData(models.WEAPON_TYPES_COLLECTION_NAME, "name", s.Type)
	if err != nil {
		return err
	}
	record.Set("weaponType", weaponType.Id)
	if s.Special != nil {
		special, err := app.FindFirstRecordByData(models.SPECIALS_COLLECTION_NAME, "name", s.Special)
		if err != nil {
			return err
		}
		record.Set("special", special.Id)
	}
	file, err := filesystem.NewFileFromBytes(s.IconContent, s.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}

type Character struct {
	Name         string  `db:"name"`
	Rarity       int     `db:"rarity"`
	Element      *string `db:"element"`
	WeaponType   string  `db:"weaponType"`
	Special      string  `db:"special"`
	IconContent  Icon    `db:"iconContent"`
	IconFilename string  `db:"iconFilename"`
}

func (s Character) Save(app core.App) error {
	record, err := upsertRecordByName(app, models.CHARACTERS_COLLECTION_NAME, s.Name)
	if err != nil {
		return err
	}
	record.Set("rarity", s.Rarity)
	if s.Element != nil {
		element, err := app.FindFirstRecordByData(models.ELEMENTS_COLLECTION_NAME, "name", s.Element)
		if err != nil {
			return err
		}
		record.Set("element", element.Id)
	}
	weaponType, err := app.FindFirstRecordByData(models.WEAPON_TYPES_COLLECTION_NAME, "name", s.WeaponType)
	if err != nil {
		return err
	}
	record.Set("weaponType", weaponType.Id)
	special, err := app.FindFirstRecordByData(models.SPECIALS_COLLECTION_NAME, "name", s.Special)
	if err != nil {
		return err
	}
	record.Set("special", special.Id)
	file, err := filesystem.NewFileFromBytes(s.IconContent, s.IconFilename)
	if err != nil {
		return err
	}
	record.Set("icon", file)
	return app.Save(record)
}
