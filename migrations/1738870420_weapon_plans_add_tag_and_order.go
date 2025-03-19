package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.WEAPON_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		collection.Fields.AddAt(3, &core.SelectField{
			Name:   "tag",
			Values: []string{"now", "need"},
		})
		collection.Fields.AddAt(3, &core.NumberField{
			Name:    "order",
			OnlyInt: true,
			Min:     types.Pointer(float64(1)),
		})
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.WEAPON_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		collection.Fields.RemoveByName("tag")
		collection.Fields.RemoveByName("order")
		return app.Save(collection)
	})
}
