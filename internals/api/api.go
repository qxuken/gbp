// Package api holds the custom routes served next to the PocketBase ones.
package api

import (
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"

	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/ui"
)

// Bind registers the SPA and the custom /api routes on the app serve event.
func Bind(app core.App, latestDumpCache *models.LatestDbDumpCache) {
	bindStatic(app)

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		g := se.Router.Group("/api")

		bindPlansRoutes(app, g)
		bindDumpRoutes(app, g, latestDumpCache)

		return se.Next()
	})
}

// bindStatic serves the embedded frontend assets.
func bindStatic(app core.App) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		fs := ui.GetAssetsFileSystem(app)
		se.Router.GET("/{path...}", apis.Static(fs, true)).Bind(apis.Gzip())
		return se.Next()
	})
}
