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
		users.AuthRule = types.Pointer("verified = true")
		if err := app.Save(users); err != nil {
			return err
		}

		if !app.IsDev() {
			return nil
		}

		record := core.NewRecord(users)
		record.Set("name", "Qest Testovich")
		record.Set("email", "test@test.com")
		record.Set("password", "testtest")
		record.Set("verified", true)
		return app.Save(record)
	}, nil)
}
