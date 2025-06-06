package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		characterPlans, err := app.FindCollectionByNameOrId(models.CHARACTER_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		weapons, err := app.FindCollectionByNameOrId(models.WEAPONS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.WEAPON_PLANS_COLLECTION_NAME)
		collection.Fields.Add(&core.RelationField{
			Name:          "characterPlan",
			Required:      true,
			CollectionId:  characterPlans.Id,
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
			Name:     "levelCurrent",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(0)),
			Max:      types.Pointer(float64(90)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "levelTarget",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(90)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "refinementCurrent",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(5)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "refinementTarget",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(5)),
		})
		collection.Fields.Add(&core.AutodateField{
			Name:     "created",
			OnCreate: true,
		})
		collection.Fields.Add(&core.AutodateField{
			Name:     "updated",
			OnCreate: true,
			OnUpdate: true,
		})
		collection.AddIndex("idx_"+models.WEAPON_PLANS_COLLECTION_NAME+"_characterPlan", false, "`characterPlan`", "")
		rule := `@request.auth.id != "" && characterPlan.user = @request.auth.id`
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
