package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.ARTIFACT_SETS_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		collection.Fields.AddAt(3, &core.NumberField{
			Name:    "order",
			OnlyInt: true,
		})
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.ARTIFACT_SETS_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		collection.Fields.RemoveByName("order")
		return app.Save(collection)
	})
}
