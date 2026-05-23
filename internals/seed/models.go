package seed

import (
	"github.com/pocketbase/pocketbase/tools/types"
)

type Icon []byte

func (item Icon) GoString() string {
	return "<icon>"
}

type Special struct {
	Id      string `db:"id" pb:"id"`
	Name    string `db:"name" pb:"name"`
	Substat bool   `db:"substat" pb:"substat"`
	Order   int    `db:"order" pb:"order"`
}

type Element struct {
	Id               string `db:"id" pb:"id"`
	Name             string `db:"name" pb:"name"`
	Color            string `db:"color" pb:"color"`
	InverseTextColor bool   `db:"inverseTextColor" pb:"inverseTextColor"`
	IconContent      Icon   `db:"iconContent" pb:"icon,file"`
	IconFilename     string `db:"iconFilename" pb:"icon,fileext"`
}

type CharacterRole struct {
	Id   string `db:"id" pb:"id"`
	Name string `db:"name" pb:"name"`
}

type ArtifactSet struct {
	Id           string `db:"id" pb:"id"`
	Name         string `db:"name" pb:"name"`
	Rarity       string `db:"rarity" pb:"rarity"`
	Patch        string `db:"patch" pb:"patch,opt"`
	Useless      bool   `db:"useless" pb:"useless"`
	IconFilename string `db:"iconFilename" pb:"icon,fileext"`
	IconContent  Icon   `db:"iconContent" pb:"icon,file"`
}

type ArtifactType struct {
	Id           string                  `db:"id" pb:"id"`
	Name         string                  `db:"name" pb:"name"`
	Specials     types.JSONArray[string] `db:"specials" pb:"specials,json"`
	Order        int                     `db:"order" pb:"order"`
	IconContent  Icon                    `db:"iconContent" pb:"icon,file"`
	IconFilename string                  `db:"iconFilename" pb:"icon,fileext"`
}

type DomainOfBlessing struct {
	Id           string                  `db:"id" pb:"id"`
	Name         string                  `db:"name" pb:"name"`
	ArtifactSets types.JSONArray[string] `db:"artifactSets" pb:"artifactSets,json"`
}

type WeaponType struct {
	Id           string `db:"id" pb:"id"`
	Name         string `db:"name" pb:"name"`
	IconContent  Icon   `db:"iconContent" pb:"icon,file"`
	IconFilename string `db:"iconFilename" pb:"icon,fileext"`
}

type Weapon struct {
	Id           string `db:"id" pb:"id"`
	Name         string `db:"name" pb:"name"`
	Rarity       int    `db:"rarity" pb:"rarity"`
	WeaponType   string `db:"weaponType" pb:"weaponType"`
	Special      string `db:"special" pb:"special"`
	Patch        string `db:"patch" pb:"patch,opt"`
	Useless      bool   `db:"useless" pb:"useless"`
	IconContent  Icon   `db:"iconContent" pb:"icon,file"`
	IconFilename string `db:"iconFilename" pb:"icon,fileext"`
}

type Patch struct {
	Id    string `db:"id" pb:"id"`
	Major int    `db:"major" pb:"major"`
	Patch int    `db:"patch" pb:"patch,opt"`
}

type Character struct {
	Id           string `db:"id" pb:"id"`
	Name         string `db:"name" pb:"name"`
	Rarity       int    `db:"rarity" pb:"rarity"`
	Element      string `db:"element" pb:"element"`
	WeaponType   string `db:"weaponType" pb:"weaponType"`
	Special      string `db:"special" pb:"special"`
	Patch        string `db:"patch" pb:"patch,opt"`
	IconContent  Icon   `db:"iconContent" pb:"icon,file"`
	IconFilename string `db:"iconFilename" pb:"icon,fileext"`
}
