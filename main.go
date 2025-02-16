package main

import (
	_ "embed"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	"github.com/qxuken/gbp/assets"
	"github.com/qxuken/gbp/internals/completions"
	_ "github.com/qxuken/gbp/migrations"
	"github.com/qxuken/gbp/seed"
	"github.com/qxuken/gbp/templates"
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
		gp := se.Router.Group("/assets")
		gp.GET("/{path...}", apis.Static(assets.GetAssetsFileSystem(app), false))
		gp.Bind(apis.Gzip())
		return se.Next()
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		templates, err := templates.NewTemplates()
		if err != nil {
			log.Fatalln(err)
		}

		gp := se.Router.Group("")

		gp.GET("/", func(e *core.RequestEvent) error {
			return e.HTML(http.StatusOK, templates.Index)
		})

		gp.GET("/signin", func(e *core.RequestEvent) error {
			return e.HTML(http.StatusOK, templates.SignIn)
		})

		gp.GET("/signup", func(e *core.RequestEvent) error {
			return e.HTML(http.StatusOK, templates.SignUp)
		})

		gp.GET("/confirm-email", func(e *core.RequestEvent) error {
			return e.HTML(http.StatusOK, templates.RenderConfirmEmail)
		})

		gp.GET("/not-found", func(e *core.RequestEvent) error {
			return e.HTML(http.StatusOK, templates.NotFound)
		})

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
