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
		team_members, err := app.FindCollectionByNameOrId(models.TEAM_MEMBERS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.TEAM_PLANS_COLLECTION_NAME)
		collection.Fields.Add(&core.RelationField{
			Name:         "character_plan",
			Required:     true,
			CollectionId: character_plans.Id,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "team_members",
			Required:     true,
			CollectionId: team_members.Id,
			MaxSelect:    4,
		})
		collection.AddIndex("idx_"+models.TEAM_PLANS_COLLECTION_NAME+"_character_plan", false, "`character_plan`", "")
		rule := `@request.auth.id != "" && character_plan.user = @request.auth.id`
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
