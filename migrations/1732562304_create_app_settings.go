package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/qxuken/gbp/models"
)

func init() {
	m.Register(func(app core.App) error {
		if _, err := app.FindCollectionByNameOrId(models.APP_SETTINGS_DB_KEY); err == nil {
			return nil
		}
		systemSettings := core.NewBaseCollection(models.APP_SETTINGS_DB_KEY)
		systemSettings.Fields.Add(&core.TextField{
			Name:        "key",
			Required:    true,
			Presentable: true,
		})
		systemSettings.Fields.Add(&core.TextField{
			Name:     "value",
			Required: true,
		})
		systemSettings.Fields.Add(&core.AutodateField{
			Name:     "created",
			Hidden:   true,
			System:   true,
			OnCreate: true,
		})
		systemSettings.Fields.Add(&core.AutodateField{
			Name:     "updated",
			Hidden:   true,
			System:   true,
			OnCreate: true,
			OnUpdate: true,
		})
		systemSettings.AddIndex("idx_app_settings_key", true, "`key`", "")
		systemSettings.System = true
		return app.Save(systemSettings)
	}, nil)
}
