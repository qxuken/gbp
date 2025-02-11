package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/models"
)

func init() {
	m.Register(func(app core.App) error {
		weapon_types, err := app.FindCollectionByNameOrId(models.WEAPON_TYPES_COLLECTION_NAME)
		if err != nil {
			return err
		}
		weapon_specials, err := app.FindCollectionByNameOrId(models.WEAPON_SPECIALS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		collection := core.NewBaseCollection(models.WEAPONS_COLLECTION_NAME)
		collection.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "weapon_type",
			Required:     true,
			CollectionId: weapon_types.Id,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "weapon_special",
			Required:     false,
			CollectionId: weapon_specials.Id,
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "rarity",
			Required: true,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(5)),
		})
		collection.AddIndex("idx_"+models.WEAPONS_COLLECTION_NAME+"_id", false, "`id`", "")
		collection.CreateRule = types.Pointer("")
		collection.UpdateRule = types.Pointer("")
		collection.DeleteRule = types.Pointer("")
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.WEAPONS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
