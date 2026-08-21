package main

import (
	_ "embed"
	"log"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	"github.com/qxuken/gbp/internals/api"
	"github.com/qxuken/gbp/internals/completions"
	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/internals/seed"
	_ "github.com/qxuken/gbp/migrations"
)

func main() {
	isDevMode := strings.HasPrefix(os.Args[0], os.TempDir()) || strings.HasSuffix(os.Args[0], "/tmp/main.exe")

	app := pocketbase.NewWithConfig(pocketbase.Config{
		DefaultDev: isDevMode,
	})

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: true,
	})

	app.RootCmd.AddCommand(seed.NewCobraSeedCommand(app))

	app.RootCmd.AddCommand(seed.NewCobraDumpCommand(app))

	app.RootCmd.AddCommand(seed.NewCobraSeedHashCommand())

	app.RootCmd.AddCommand(completions.NewCompletionsCommand(app.RootCmd))

	latestDumpCache := models.NewLatestDbDumpCache()
	latestDumpCache.Bind(app)

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		if err := seed.UpdateFromPreload(app, latestDumpCache); err != nil {
			app.Logger().Error(err.Error())
		}
		return se.Next()
	})

	api.Bind(app, latestDumpCache)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
