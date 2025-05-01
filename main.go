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

	"github.com/qxuken/gbp/internals/completions"
	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/internals/seed"
	_ "github.com/qxuken/gbp/migrations"
	"github.com/qxuken/gbp/ui"
)

type planCollectionDict struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

var PLANS_COLLECTIONS = []string{
	models.CHARACTER_PLANS_COLLECTION_NAME,
	models.WEAPON_PLANS_COLLECTION_NAME,
	models.ARTIFACT_SETS_PLANS_COLLECTION_NAME,
	models.ARTIFACT_TYPE_PLANS_COLLECTION_NAME,
	models.TEAM_PLANS_COLLECTION_NAME,
}

func loadCollectionsDictionary(app core.App) []planCollectionDict {
	plansCollections := make([]planCollectionDict, 0, len(PLANS_COLLECTIONS))
	for _, collectionName := range PLANS_COLLECTIONS {
		if loadedCollection, err := app.FindCollectionByNameOrId(collectionName); err == nil {
			plansCollections = append(plansCollections, planCollectionDict{loadedCollection.Id, loadedCollection.Name})
		}
	}
	return plansCollections
}

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

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		g := se.Router.Group("/api")
		g.GET("/dictionaryVersion", func(e *core.RequestEvent) error {
			rec, err := models.FindAppSettingsByKey(app, "dictionaryVersion")
			if err != nil {
				return err
			}
			return e.JSON(http.StatusOK, rec.Value())
		})

		plansCollections := loadCollectionsDictionary(app)
		g.GET("/plansCollections", func(e *core.RequestEvent) error {
			return e.JSON(http.StatusOK, plansCollections)
		})
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
