package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		collection := core.NewBaseCollection(models.SPECIALS_COLLECTION_NAME)
		collection.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "order",
			Required: true,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:    "substat",
			OnlyInt: true,
			Min:     types.Pointer(float64(0)),
			Max:     types.Pointer(float64(1)),
		})
		collection.ListRule = types.Pointer("")
		collection.ViewRule = types.Pointer("")
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.SPECIALS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
