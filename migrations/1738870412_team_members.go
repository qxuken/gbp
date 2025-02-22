package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		characters, err := app.FindCollectionByNameOrId(models.CHARACTERS_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		character_roles, err := app.FindCollectionByNameOrId(models.CHARACTER_ROLES_COLLECTION_NAME)
		if err != nil {
			return nil
		}
		collection := core.NewBaseCollection(models.TEAM_MEMBERS_COLLECTION_NAME)
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
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.TEAM_MEMBERS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
