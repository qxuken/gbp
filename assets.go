package main

import (
	"embed"
	"io/fs"
	"os"

	"github.com/pocketbase/pocketbase"
)

var (
	//go:embed assets/*
	assets embed.FS
)

func getAssetsFileSystem(app *pocketbase.PocketBase) fs.FS {
	l := app.Logger().WithGroup("assets")
	if app.IsDev() {
		l.Debug("assets: using live mode")
		return os.DirFS("assets")
	}
	l.Debug("assets: using embed mode")
	fsys, err := fs.Sub(assets, "assets")
	if err != nil {
		panic(err)
	}
	return fsys
}
