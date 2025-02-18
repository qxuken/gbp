package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		character_plans, err := app.FindCollectionByNameOrId(models.CHARACTER_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		artifact_types, err := app.FindCollectionByNameOrId(models.ARTIFACT_TYPES_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		specials, err := app.FindCollectionByNameOrId(models.SPECIALS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.ARTIFACT_TYPE_PLANS_COLLECTION_NAME)
		collection.Fields.Add(&core.RelationField{
			Name:         "character_plan",
			Required:     true,
			CollectionId: character_plans.Id,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "artifact_type",
			Required:     true,
			CollectionId: artifact_types.Id,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "special",
			Required:     true,
			CollectionId: specials.Id,
		})
		collection.AddIndex("idx_"+models.ARTIFACT_TYPE_PLANS_COLLECTION_NAME+"_id", false, "`id`", "")
		collection.AddIndex("idx_"+models.ARTIFACT_TYPE_PLANS_COLLECTION_NAME+"_character_plan", false, "`character_plan`", "")
		collection.ListRule = types.Pointer(`@request.auth.id != "" && character_plan.user = @request.auth.id`)
		collection.ViewRule = types.Pointer(`@request.auth.id != "" && character_plan.user = @request.auth.id`)
		collection.CreateRule = types.Pointer(`@request.auth.id != "" && character_plan.user = @request.auth.id`)
		collection.UpdateRule = types.Pointer(`@request.auth.id != "" && character_plan.user = @request.auth.id`)
		collection.DeleteRule = types.Pointer(`@request.auth.id != "" && character_plan.user = @request.auth.id`)
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.ARTIFACT_TYPE_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
