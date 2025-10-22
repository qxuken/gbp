package seed

import (
	"database/sql"
	"errors"
	"fmt"
	"path"
	"path/filepath"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

func upsertRecordById(app core.App, collectionId string, id string) (*core.Record, error) {
	collection, err := app.FindCollectionByNameOrId(collectionId)
	if err != nil {
		return nil, err
	}
	record, err := app.FindRecordById(collection, id)
	if err == sql.ErrNoRows {
		record = core.NewRecord(collection)
		record.Set("id", id)
		return record, nil
	}
	return record, err
}

func seedCollection[T SeedItem](app core.App, db dbx.Builder, sourceTable string) error {
	app.Logger().Debug(fmt.Sprintf("Seeding %v", sourceTable))
	items := []T{}
	if err := db.NewQuery(fmt.Sprintf("select * from %v", sourceTable)).All(&items); err != nil {
		return err
	}
	app.Logger().Debug(fmt.Sprintf("Fetched %v", sourceTable))
	for _, s := range items {
		if err := s.Seed(app); err != nil {
			return err
		}
	}
	return nil
}

func getFileContent(fsys *filesystem.System, record *core.Record, fieldName string) (string, []byte, error) {
	orignalFileName := record.GetString(fieldName)
	iconPath := path.Join(record.BaseFilesPath(), orignalFileName)

	name := record.GetString("name")
	fileName := strings.ReplaceAll(strings.ReplaceAll(strings.ToLower(name), " ", "_"), "'", "_") + filepath.Ext(iconPath)

	r, err := fsys.GetReader(iconPath)
	if err != nil {
		return "", nil, err
	}
	defer r.Close()
	buffer := make([]byte, r.Size())
	n, err := r.Read(buffer)
	if err != nil {
		return "", nil, err
	}
	if n < int(r.Size()) {
		return "", nil, errors.New("File read corruption")
	}

	return fileName, buffer, nil
}

func dumpCollection[T DumpItem](app core.App, fsys *filesystem.System, db dbx.Builder, sourceTable string) error {
	app.Logger().Debug(fmt.Sprintf("Dumping %v", sourceTable))
	records, err := app.FindAllRecords(sourceTable)
	if err != nil {
		return err
	}
	var value T
	for _, s := range records {
		if err := value.Dump(db, fsys, s); err != nil {
			return err
		}
	}

	app.Logger().Debug(fmt.Sprintf("Dumped %v", sourceTable))
	return nil
}
