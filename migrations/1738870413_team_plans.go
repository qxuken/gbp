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
		characters, err := app.FindCollectionByNameOrId(models.CHARACTERS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.TEAM_PLANS_COLLECTION_NAME)
		collection.Fields.Add(&core.RelationField{
			Name:          "characterPlan",
			Required:      true,
			CollectionId:  characterPlans.Id,
			MaxSelect:     1,
			CascadeDelete: true,
		})
		collection.Fields.Add(&core.RelationField{
			Name:          "characters",
			Required:      true,
			CollectionId:  characters.Id,
			MaxSelect:     3,
			CascadeDelete: true,
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
		collection.AddIndex("idx_"+models.TEAM_PLANS_COLLECTION_NAME+"_characterPlan", false, "`characterPlan`", "")
		rule := `@request.auth.id != "" && characterPlan.user = @request.auth.id`
		collection.ListRule = types.Pointer(rule)
		collection.ViewRule = types.Pointer(rule)
		collection.CreateRule = types.Pointer(rule)
		collection.UpdateRule = types.Pointer(rule)
		collection.DeleteRule = types.Pointer(rule)
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.TEAM_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
