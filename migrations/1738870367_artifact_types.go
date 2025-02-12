package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/models"
)

func init() {
	m.Register(func(app core.App) error {
		specials, err := app.FindCollectionByNameOrId(models.SPECIALS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		collection := core.NewBaseCollection(models.ARTIFACT_TYPES_COLLECTION_NAME)
		collection.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
		})
		collection.Fields.Add(&core.FileField{
			Name:      "icon",
			Required:  true,
			MimeTypes: []string{"image/png", "image/webp"},
			Thumbs:    []string{"16x16", "32x32"},
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "specials",
			Required:     true,
			CollectionId: specials.Id,
			MaxSelect:    50,
		})
		collection.AddIndex("idx_"+models.ARTIFACT_TYPES_COLLECTION_NAME+"_id", false, "`id`", "")
		collection.CreateRule = types.Pointer("")
		collection.UpdateRule = types.Pointer("")
		collection.DeleteRule = types.Pointer("")
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.ARTIFACT_TYPES_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
