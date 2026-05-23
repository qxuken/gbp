package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2585443140")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(4, []byte(`{
			"cascadeDelete": false,
			"collectionId": "pbc_695019741",
			"hidden": false,
			"id": "relation3794507318",
			"maxSelect": 1,
			"minSelect": 0,
			"name": "patch",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "relation"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2585443140")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("relation3794507318")

		return app.Save(collection)
	})
}
