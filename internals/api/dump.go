package api

import (
	"database/sql"
	"io"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"

	"github.com/qxuken/gbp/internals/models"
	"github.com/qxuken/gbp/internals/seed"
)

// bindDumpRoutes registers the superuser gated seed management routes plus the
// public endpoints exposing the latest dump.
func bindDumpRoutes(app core.App, g *router.RouterGroup[*core.RequestEvent], latestDumpCache *models.LatestDbDumpCache) {
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
		mf, _, err := e.Request.FormFile("dump")
		if err != nil {
			return e.BadRequestError(err.Error(), nil)
		}
		defer mf.Close()
		tmpFile, err := os.CreateTemp(app.DataDir(), "*-dump.db")
		if err != nil {
			return e.InternalServerError(err.Error(), nil)
		}
		tmpPath := tmpFile.Name()
		defer os.Remove(tmpPath)
		// the upload is streamed to disk, a large dump doesn't fit in memory
		// and a single Read is allowed to return less than the full file
		if _, err = io.Copy(tmpFile, mf); err != nil {
			tmpFile.Close()
			return e.InternalServerError(err.Error(), nil)
		}
		if err = tmpFile.Close(); err != nil {
			return e.InternalServerError(err.Error(), nil)
		}
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
		dump, err := models.FindDbDumpById(app, dumpId)
		if err == sql.ErrNoRows {
			return e.NotFoundError(err.Error(), nil)
		} else if err != nil {
			return e.InternalServerError(err.Error(), nil)
		}
		err = seed.Seed(app, dump.DumpPath(app))
		if err != nil {
			return e.InternalServerError(err.Error(), nil)
		}
		return e.JSON(http.StatusOK, map[string]any{"status": "ok"})
	})

	g.GET("/dump/latest", func(e *core.RequestEvent) error {
		latestDump, err := latestDumpCache.Get(app)
		if err == sql.ErrNoRows {
			return e.NotFoundError("No dumps found", nil)
		} else if err != nil {
			return e.InternalServerError(err.Error(), nil)
		}
		return e.JSON(http.StatusOK, map[string]any{
			"hash":  latestDump.Hash(),
			"notes": latestDump.Notes(),
		})
	})

	g.GET("/dump/latest_seed.db", func(e *core.RequestEvent) error {
		latestDump, err := latestDumpCache.Get(app)
		if err == sql.ErrNoRows {
			return e.NotFoundError("No dumps found", nil)
		} else if err != nil {
			return e.InternalServerError(err.Error(), nil)
		}
		return e.FileFS(os.DirFS(latestDump.DumpDir(app)), latestDump.DumpFilename())
	})
}
