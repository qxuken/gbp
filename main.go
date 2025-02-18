package main

import (
	_ "embed"
	"log"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	"github.com/qxuken/gbp/internals/completions"
	"github.com/qxuken/gbp/internals/seed"
	_ "github.com/qxuken/gbp/migrations"
	"github.com/qxuken/gbp/ui"
)

func main() {
	isDevMode := strings.HasPrefix(os.Args[0], os.TempDir()) || strings.HasSuffix(os.Args[0], "/tmp/main.exe")

	app := pocketbase.NewWithConfig(pocketbase.Config{
		DefaultDev: isDevMode,
	})

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: isDevMode,
	})

	app.RootCmd.AddCommand(seed.NewCobraCommand(app))

	app.RootCmd.AddCommand(completions.NewCompletionsCommand(app.RootCmd))

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		fs := ui.GetAssetsFileSystem(app)
		se.Router.GET("/{path...}", apis.Static(fs, true)).Bind(apis.Gzip())
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
