package main

import (
	"database/sql"
	_ "embed"
	"log"
	"net/http"
	"os"
	"path"
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

	app.RootCmd.AddCommand(seed.NewCobraSeedCommand(app))

	app.RootCmd.AddCommand(seed.NewCobraDumpCommand(app))

	app.RootCmd.AddCommand(completions.NewCompletionsCommand(app.RootCmd))

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		fs := ui.GetAssetsFileSystem(app)
		se.Router.GET("/{path...}", apis.Static(fs, true)).Bind(apis.Gzip())
		return se.Next()
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		g := se.Router.Group("/api")

		plansCollections := loadCollectionsDictionary(app)
		g.GET("/plansCollections", func(e *core.RequestEvent) error {
			return e.JSON(http.StatusOK, plansCollections)
		})

		g.GET("/dictionaryVersion", func(e *core.RequestEvent) error {
			rec, err := models.FindAppSettingsByKey(app, "dictionaryVersion")
			if err != nil {
				return err
			}
			return e.JSON(http.StatusOK, rec.Value())
		})

		g.POST("/dump/generate", func(e *core.RequestEvent) error {
			if !e.HasSuperuserAuth() {
				return e.UnauthorizedError("", nil)
			}
			data := struct {
				Notes string `json:"notes" form:"notes"`
			}{}
			if err := e.BindBody(&data); err != nil {
				return e.BadRequestError("Failed to read request data", err)
			}
			tmpFile, err := os.CreateTemp("./tmp", "*-dump.db")
			if err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			tmpPath := tmpFile.Name()
			tmpFile.Close()
			defer os.Remove(tmpPath)
			err = seed.Dump(app, tmpPath, data.Notes)
			if err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			return e.JSON(http.StatusOK, map[string]any{"status": "ok"})
		})

		g.POST("/dump/upload", func(e *core.RequestEvent) error {
			if !e.HasSuperuserAuth() {
				return e.UnauthorizedError("", nil)
			}
			notes := e.Request.FormValue("notes")
			mf, mh, err := e.Request.FormFile("dump")
			buf := make([]byte, mh.Size)
			if _, err = mf.Read(buf); err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			tmpFile, err := os.CreateTemp("./tmp", "*-dump.db")
			tmpPath := tmpFile.Name()
			if err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			if _, err = tmpFile.Write(buf); err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			tmpFile.Close()
			defer os.Remove(tmpPath)
			err = seed.SaveDump(app, tmpPath, notes)
			if err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			return e.JSON(http.StatusOK, map[string]any{"status": "ok"})
		})

		g.POST("/dump/restore/{dumpId}", func(e *core.RequestEvent) error {
			if !e.HasSuperuserAuth() {
				return e.UnauthorizedError("", nil)
			}
			dumpId := e.Request.PathValue("dumpId")
			dump, err := app.FindRecordById(models.DB_DUMPS_COLLECTION_NAME, dumpId)
			if err == sql.ErrNoRows {
				return e.NotFoundError(err.Error(), nil)
			} else if err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			dumpPath := path.Join(app.DataDir(), "storage", dump.BaseFilesPath(), dump.GetString("dump"))
			err = seed.Seed(app, dumpPath)
			if err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			return e.JSON(http.StatusOK, map[string]any{"status": "ok"})
		})

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
