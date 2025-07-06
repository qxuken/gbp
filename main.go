package main

import (
	"database/sql"
	_ "embed"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/pocketbase/dbx"
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

const (
	PRELOAD_SEED_FILE = "./seed.db"
	PRELOAD_SEED_HASH = "./seed.hash"
	PRELOAD_SEED_NOTE = "./seed.note"
)

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

func updateSeed(app core.App) error {
	app.Logger().Debug("Checking seed.hash")
	hash, err := os.ReadFile(PRELOAD_SEED_HASH)
	if err != nil {
		return err
	}
	note, _ := os.ReadFile(PRELOAD_SEED_NOTE)
	dictionaryVersion, err := models.FindAppSettingsByKey(app, "dictionaryVersion")
	if err == nil && dictionaryVersion != nil && dictionaryVersion.Value() == string(hash) {
		app.Logger().Debug("No seed update required")
		return nil
	}
	latestDumps, err := app.FindRecordsByFilter(models.DB_DUMPS_COLLECTION_NAME, "", "-created", 1, 0, dbx.Params{})
	if err == nil && len(latestDumps) > 0 {
		for _, dump := range latestDumps {
			if dump.GetString("hash") == string(hash) {
				app.Logger().Debug("No seed update required")
				return nil
			}
		}
	}
	if err = seed.SaveDump(app, PRELOAD_SEED_FILE, string(note)); err != nil {
		return err
	}
	if err = seed.Seed(app, PRELOAD_SEED_FILE); err != nil {
		return err
	}
	return nil
}

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

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		err := updateSeed(app)
		if err != nil {
			app.Logger().Error(err.Error())
		}
		return se.Next()
	})

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
			tmpFile, err := os.CreateTemp(app.DataDir(), "*-dump.db")
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
			err = seed.UpdateDictionaryVersion(app, tmpPath)
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
			if err != nil {
				return e.BadRequestError(err.Error(), nil)
			}
			buf := make([]byte, mh.Size)
			if _, err = mf.Read(buf); err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			tmpFile, err := os.CreateTemp(app.DataDir(), "*-dump.db")
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
			err = seed.Seed(app, tmpPath)
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

		g.GET("/dump/latest_seed.db", func(e *core.RequestEvent) error {
			latestDumps, err := app.FindRecordsByFilter(models.DB_DUMPS_COLLECTION_NAME, "", "-created", 1, 0, dbx.Params{})
			if latestDumps != nil && len(latestDumps) < 1 {
				return e.NotFoundError("No dumps found", nil)
			} else if err != nil {
				return e.InternalServerError(err.Error(), nil)
			}
			latestDump := latestDumps[0]

			dir_fs := path.Join(app.DataDir(), "storage", latestDump.BaseFilesPath())
			return e.FileFS(os.DirFS(dir_fs), latestDump.GetString("dump"))
		})

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
