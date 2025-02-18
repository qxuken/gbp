package seed

import (
	"database/sql"
	"fmt"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

func upsertRecordByName(app core.App, collectionId string, name string) (*core.Record, error) {
	collection, err := app.FindCollectionByNameOrId(collectionId)
	if err != nil {
		return nil, err
	}
	record, err := app.FindFirstRecordByData(collection, "name", name)
	if err == sql.ErrNoRows {
		record = core.NewRecord(collection)
		record.Set("name", name)
		return record, nil
	}
	return record, err
}

func seedCollection[T SeedItem](app core.App, db *dbx.DB, sourceTable string) error {
	app.Logger().Debug(fmt.Sprintf("Seeding %v", sourceTable))
	items := []T{}
	if err := db.NewQuery(fmt.Sprintf("select * from %v", sourceTable)).All(&items); err != nil {
		return err
	}
	for _, s := range items {
		if err := s.Save(app); err != nil {
			return err
		}
	}
	return nil
}
