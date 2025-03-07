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
		characterRoles, err := app.FindCollectionByNameOrId(models.CHARACTER_ROLES_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		artifactSets, err := app.FindCollectionByNameOrId(models.ARTIFACT_SETS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.CHARACTER_PLANS_COLLECTION_NAME)
		collection.Fields.Add(&core.RelationField{
			Name:          "user",
			Required:      true,
			CollectionId:  users.Id,
			MaxSelect:     1,
			Presentable:   true,
			CascadeDelete: true,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "character",
			Required:     true,
			CollectionId: characters.Id,
			MaxSelect:    1,
			Presentable:  true,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "characterRole",
			Required:     false,
			CollectionId: characterRoles.Id,
			MaxSelect:    1,
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "constellationCurrent",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(6)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "constellationTarget",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(6)),
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
			Name:     "talentAtkCurrent",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(10)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talentAtkTarget",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(10)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talentSkillCurrent",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(13)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talentSkillTarget",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(13)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talentBurstCurrent",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(13)),
		})
		collection.Fields.Add(&core.NumberField{
			Name:     "talentBurstTarget",
			Required: false,
			OnlyInt:  true,
			Min:      types.Pointer(float64(1)),
			Max:      types.Pointer(float64(13)),
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "artifactSets",
			Required:     false,
			CollectionId: artifactSets.Id,
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
