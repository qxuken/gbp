package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		users, err := app.FindCollectionByNameOrId(models.USERS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		characters, err := app.FindCollectionByNameOrId(models.CHARACTERS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		character_roles, err := app.FindCollectionByNameOrId(models.CHARACTER_ROLES_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		artifact_sets, err := app.FindCollectionByNameOrId(models.ARTIFACT_SETS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.CHARACTER_PLANS_COLLECTION_NAME)
		collection.Fields.Add(&core.RelationField{
			Name:         "user",
			Required:     true,
			CollectionId: users.Id,
			MaxSelect:    1,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "character",
			Required:     true,
			CollectionId: characters.Id,
			MaxSelect:    1,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "character_role",
			Required:     false,
			CollectionId: character_roles.Id,
			MaxSelect:    1,
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "constellation_current",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(6)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "constellation_target",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(6)),
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
			Name:     "talent_atk_current",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(10)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talent_atk_target",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(10)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talent_skill_current",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(13)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talent_skill_target",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(13)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talent_burst_current",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(13)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talent_burst_target",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(13)),
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "artifact_sets",
			Required:     false,
			CollectionId: artifact_sets.Id,
			MaxSelect:    50,
		})
		collection.AddIndex("idx_"+models.CHARACTER_PLANS_COLLECTION_NAME+"_user", false, "`user`", "")
		rule := `@request.auth.id != "" && user = @request.auth.id`
		collection.ListRule = types.Pointer(rule)
		collection.ViewRule = types.Pointer(rule)
		collection.CreateRule = types.Pointer(rule)
		collection.UpdateRule = types.Pointer(rule)
		collection.DeleteRule = types.Pointer(rule)
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.CHARACTER_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
