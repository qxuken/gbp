package migrations

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		_, err := app.DB().NewQuery(fmt.Sprintf(`
				UPDATE %s
				SET  tag = CASE
				WHEN tag = ''     THEN 'none'
				WHEN tag = 'now'  THEN 'current'
				WHEN tag = 'need' THEN 'target'
				ELSE tag
				END;
				`,
			models.WEAPON_PLANS_COLLECTION_NAME)).
			Execute()
		if err != nil {
			return err
		}
		collection, err := app.FindCollectionByNameOrId(models.WEAPON_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		var fieldId string
		if field := collection.Fields.GetByName("tag"); field != nil {
			fieldId = field.GetId()
		}
		collection.Fields.Add(&core.SelectField{
			Id:     fieldId,
			Name:   "tag",
			Values: []string{"none", "current", "target"},
		})
		return app.Save(collection)
	}, func(app core.App) error {
		_, err := app.DB().NewQuery(fmt.Sprintf(`
				UPDATE %s
				SET  tag = CASE
				WHEN tag = 'none'    THEN ''
				WHEN tag = 'current' THEN 'now'
				WHEN tag = 'target'  THEN 'need'
				ELSE tag
				END;
				`,
			models.WEAPON_PLANS_COLLECTION_NAME)).
			Execute()
		if err != nil {
			return err
		}
		collection, err := app.FindCollectionByNameOrId(models.WEAPON_PLANS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		var fieldId string
		if field := collection.Fields.GetByName("tag"); field != nil {
			fieldId = field.GetId()
		}
		collection.Fields.Add(&core.SelectField{
			Id:     fieldId,
			Name:   "tag",
			Values: []string{"now", "need"},
		})
		return app.Save(collection)
	})
}
