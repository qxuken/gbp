package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_695019741")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_2VhsEO4t1h` + "`" + ` ON ` + "`" + `patch` + "`" + ` (\n  ` + "`" + `major` + "`" + `,\n  ` + "`" + `patch` + "`" + `\n)"
			],
			"listRule": "",
			"viewRule": ""
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_695019741")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [],
			"listRule": null,
			"viewRule": null
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
