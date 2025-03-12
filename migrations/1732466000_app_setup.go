package migrations

import (
	"time"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		settings := app.Settings()
		settings.Meta.AppName = "Genshin Build Planner"
		settings.Meta.SenderName = "Genshin Build Planner (no-reply)"
		settings.Meta.HideControls = !app.IsDev()
		settings.Batch.Enabled = true
		settings.Batch.MaxRequests = 100
		settings.Batch.Timeout = int64(5 * time.Second)
		return app.Save(settings)
	}, nil)
}
