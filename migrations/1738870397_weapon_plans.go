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
		weapons, err := app.FindCollectionByNameOrId(models.WEAPONS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.WEAPON_PLANS_COLLECTION_NAME)
		collection.Fields.Add(&core.RelationField{
			Name:          "character_plan",
			Required:      true,
			CollectionId:  character_plans.Id,
			MaxSelect:     1,
			CascadeDelete: true,
		})
		collection.Fields.Add(&core.RelationField{
			Name:          "weapon",
			Required:      true,
			CollectionId:  weapons.Id,
			MaxSelect:     1,
			CascadeDelete: true,
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
		collection.AddIndex("idx_"+models.WEAPON_PLANS_COLLECTION_NAME+"_character_plan", false, "`character_plan`", "")
		rule := `@request.auth.id != "" && character_plan.user = @request.auth.id`
		collection.ListRule = types.Pointer(rule)
		collection.ViewRule = types.Pointer(rule)
		collection.CreateRule = types.Pointer(rule)
		collection.UpdateRule = types.Pointer(rule)
		collection.DeleteRule = types.Pointer(rule)
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.WEAPON_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
