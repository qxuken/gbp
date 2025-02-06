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

	_ "github.com/qxuken/gbp/migrations"
)

func main() {
	isDevMode := strings.HasPrefix(os.Args[0], os.TempDir()) || strings.HasSuffix(os.Args[0], "/tmp/main.exe")

	app := pocketbase.NewWithConfig(pocketbase.Config{
		DefaultDev: isDevMode,
	})

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: isDevMode,
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		gp := se.Router.Group("/assets")
		gp.GET("/{path...}", apis.Static(getAssetsFileSystem(app), false))
		gp.Bind(apis.Gzip())
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
