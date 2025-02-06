package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/models"
)

func init() {
	m.Register(func(app core.App) error {
		character_plans, err := app.FindCollectionByNameOrId(models.CHARACTER_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		weapons, err := app.FindCollectionByNameOrId(models.WEAPONS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.WEAPON_PLANS_COLLECTION_NAME)
		collection.Fields.Add(&core.RelationField{
			Name:         "character_plan",
			Required:     true,
			CollectionId: character_plans.Id,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "weapon",
			Required:     true,
			CollectionId: weapons.Id,
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "level_current",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(0)),
			Max:      types.Pointer(float64(90)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "level_target",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(90)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "refinement_current",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(5)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "refinement_target",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(5)),
		})
		collection.AddIndex("idx_"+models.WEAPON_PLANS_COLLECTION_NAME+"_id", false, "`id`", "")
		collection.AddIndex("idx_"+models.WEAPON_PLANS_COLLECTION_NAME+"_character_plan", false, "`character_plan`", "")
		collection.ListRule = types.Pointer("character_plan.user = @request.auth.id")
		collection.ViewRule = types.Pointer("character_plan.user = @request.auth.id")
		collection.CreateRule = types.Pointer("character_plan.user = @request.auth.id")
		collection.UpdateRule = types.Pointer("character_plan.user = @request.auth.id")
		collection.DeleteRule = types.Pointer("character_plan.user = @request.auth.id")
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.WEAPON_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
