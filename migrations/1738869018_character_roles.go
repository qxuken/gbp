package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/models"
)

func init() {
	m.Register(func(app core.App) error {
		collection := core.NewBaseCollection(models.CHARACTER_ROLES_COLLECTION_NAME)
		collection.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
		})
		collection.AddIndex("idx_"+models.CHARACTER_ROLES_COLLECTION_NAME+"_id", false, "`id`", "")
		collection.ListRule = types.Pointer("")
		collection.ViewRule = types.Pointer("")
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.CHARACTER_ROLES_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
