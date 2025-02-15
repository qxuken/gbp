package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/models"
)

func init() {
	m.Register(func(app core.App) error {
		collection := core.NewBaseCollection(models.ARTIFACT_SETS_COLLECTION_NAME)
		collection.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
		})
		collection.Fields.Add(&core.FileField{
			Name:      "icon",
			Required:  true,
			MimeTypes: []string{"image/png", "image/webp"},
			Thumbs:    []string{"16x16", "32x32", "64x64", "128x128"},
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "rarity",
			Required: true,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(5)),
		})
		collection.ListRule = types.Pointer("")
		collection.ViewRule = types.Pointer("")
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.ARTIFACT_SETS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
