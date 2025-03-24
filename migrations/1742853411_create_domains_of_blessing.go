package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		artifactSets, err := app.FindCollectionByNameOrId(models.ARTIFACT_SETS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.DOMAINS_OF_BLESSING_COLLECTION_NAME)
		collection.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "artifactSets",
			Required:     true,
			CollectionId: artifactSets.Id,
			MaxSelect:    2,
		})
		collection.ListRule = types.Pointer("")
		collection.ViewRule = types.Pointer("")
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.DOMAINS_OF_BLESSING_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
