package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/qxuken/gbp/models"
)

func init() {
	m.Register(func(app core.App) error {
		users, err := app.FindCollectionByNameOrId(models.USERS_COLLECTION_NAME)
		if err != nil {
			return err
		}
		users.AuthRule = types.Pointer("verified = true")
		return app.Save(users)
	}, nil)
}
