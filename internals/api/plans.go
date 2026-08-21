package api

import (
	"net/http"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"

	"github.com/qxuken/gbp/internals/models"
)

type planCollectionDict struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

// loadCollectionsDictionary resolves the ids of the plans collections the
// frontend writes to.
func loadCollectionsDictionary(app core.App) []planCollectionDict {
	plansCollections := make([]planCollectionDict, 0, len(models.PLANS_COLLECTIONS))
	for _, collectionName := range models.PLANS_COLLECTIONS {
		if loadedCollection, err := app.FindCollectionByNameOrId(collectionName); err == nil {
			plansCollections = append(plansCollections, planCollectionDict{loadedCollection.Id, loadedCollection.Name})
		}
	}
	return plansCollections
}

func bindPlansRoutes(app core.App, g *router.RouterGroup[*core.RequestEvent]) {
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
}
