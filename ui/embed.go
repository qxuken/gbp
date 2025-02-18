package ui

import (
	"embed"
	"io/fs"
	"os"

	"github.com/pocketbase/pocketbase"
)

var (
	//go:embed all:dist
	assets embed.FS
)

func GetAssetsFileSystem(app *pocketbase.PocketBase) fs.FS {
	l := app.Logger().WithGroup("ui")
	if app.IsDev() {
		l.Debug("ui: using live mode")
		return os.DirFS("ui/dist")
	}
	l.Debug("ui: using embed mode")
	fsys, err := fs.Sub(assets, "dist")
	if err != nil {
		panic(err)
	}
	return fsys
}
