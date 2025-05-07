package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		if _, err := app.FindCollectionByNameOrId(models.DB_DUMPS_COLLECTION_NAME); err == nil {
			return nil
		}
		collections := core.NewBaseCollection(models.DB_DUMPS_COLLECTION_NAME)
		collections.Fields.Add(&core.TextField{
			Name:     "hash",
			Required: true,
		})
		collections.Fields.Add(&core.FileField{
			Name:     "dump",
			Required: true,
		})
		collections.Fields.Add(&core.EditorField{
			Name: "notes",
		})
		collections.Fields.Add(&core.AutodateField{
			Name:     "created",
			Hidden:   true,
			System:   true,
			OnCreate: true,
		})
		collections.Fields.Add(&core.AutodateField{
			Name:     "updated",
			Hidden:   true,
			System:   true,
			OnCreate: true,
			OnUpdate: true,
		})
		collections.AddIndex("idx_"+models.DB_DUMPS_COLLECTION_NAME+"_hash", true, "`hash`", "")
		collections.System = true
		return app.Save(collections)
	}, nil)
}
