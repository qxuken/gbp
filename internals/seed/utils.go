package seed

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"path"
	"path/filepath"
	"reflect"
	"strings"
	"sync"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

var fieldCache sync.Map

type pbFieldInfo struct {
	dbKey     string
	pbKey     string
	structIdx int
	isFile    bool
	isFileExt bool
	isJSON    bool
	isOpt     bool
	isPK      bool
	goType    reflect.Type
}

func getFieldInfo(t reflect.Type) ([]pbFieldInfo, error) {
	if cached, ok := fieldCache.Load(t); ok {
		return cached.([]pbFieldInfo), nil
	}
	if t.Kind() == reflect.Pointer {
		t = t.Elem()
	}
	if t.Kind() != reflect.Struct {
		return nil, fmt.Errorf("expected struct, got %s", t.Kind())
	}

	var fields []pbFieldInfo
	for i := range t.NumField() {
		f := t.Field(i)
		pbTag := f.Tag.Get("pb")
		if pbTag == "" || pbTag == "-" {
			continue
		}
		dbTag := f.Tag.Get("db")

		parts := strings.Split(pbTag, ",")
		pbKey := parts[0]
		var isFile, isFileExt, isJSON, isOpt bool
		for _, p := range parts[1:] {
			switch p {
			case "file":
				isFile = true
			case "fileext":
				isFileExt = true
			case "json":
				isJSON = true
			case "opt":
				isOpt = true
			}
		}

		fields = append(fields, pbFieldInfo{
			dbKey:     dbTag,
			pbKey:     pbKey,
			structIdx: i,
			isFile:    isFile,
			isFileExt: isFileExt,
			isJSON:    isJSON,
			isOpt:     isOpt,
			isPK:      dbTag == "id",
			goType:    f.Type,
		})
	}
	fieldCache.Store(t, fields)
	return fields, nil
}

func mustGetFieldInfo[T any]() []pbFieldInfo {
	fields, err := getFieldInfo(reflect.TypeFor[T]())
	if err != nil {
		panic(err)
	}
	return fields
}

func sqlTypeFromGo(t reflect.Type) string {
	switch t.Kind() {
	case reflect.String:
		return "TEXT"
	case reflect.Int, reflect.Int64:
		return "INTEGER"
	case reflect.Bool:
		return "BOOL"
	case reflect.Slice:
		if t.Elem().Kind() == reflect.Uint8 {
			return "BLOB"
		}
		return "TEXT"
	default:
		return "TEXT"
	}
}

func structTableSchema[T any]() map[string]string {
	fields := mustGetFieldInfo[T]()
	schema := make(map[string]string, len(fields))
	for _, fd := range fields {
		sqlType := sqlTypeFromGo(fd.goType)
		if fd.isPK {
			sqlType += " NOT NULL PRIMARY KEY"
		} else if !fd.isOpt {
			sqlType += " NOT NULL"
		}
		schema[fd.dbKey] = sqlType
	}
	return schema
}

func createTableFromStruct[T any](db dbx.Builder, tableName string) error {
	db.DropTable(tableName).Execute()
	_, err := db.CreateTable(tableName, structTableSchema[T]()).Execute()
	return err
}

func upsertRecordById(app core.App, collectionName string, id string) (*core.Record, error) {
	collection, err := app.FindCollectionByNameOrId(collectionName)
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

func seedItem[T any](app core.App, item T, collectionName string, fields []pbFieldInfo) error {
	rv := reflect.ValueOf(item)

	var id string
	for _, fd := range fields {
		if fd.isPK {
			id = rv.Field(fd.structIdx).String()
			break
		}
	}

	record, err := upsertRecordById(app, collectionName, id)
	if err != nil {
		return err
	}

	for _, fd := range fields {
		if fd.isFileExt || fd.isPK {
			continue
		}
		if fd.isFile {
			content := rv.Field(fd.structIdx).Bytes()
			var filename string
			for _, fd2 := range fields {
				if fd2.isFileExt && fd2.pbKey == fd.pbKey {
					filename = rv.Field(fd2.structIdx).String()
					break
				}
			}
			file, err := filesystem.NewFileFromBytes(content, filename)
			if err != nil {
				return err
			}
			record.Set(fd.pbKey, file)
		} else {
			record.Set(fd.pbKey, rv.Field(fd.structIdx).Interface())
		}
	}

	return app.Save(record)
}

func seedCollection[T any](app core.App, db dbx.Builder, sourceTable string) error {
	app.Logger().Debug(fmt.Sprintf("Seeding %v", sourceTable))
	items := []T{}
	if err := db.NewQuery(fmt.Sprintf("select * from %v", sourceTable)).All(&items); err != nil {
		return err
	}
	app.Logger().Debug(fmt.Sprintf("Fetched %v", sourceTable))

	fields := mustGetFieldInfo[T]()
	for _, s := range items {
		if err := seedItem(app, s, sourceTable, fields); err != nil {
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

func dumpItem[T any](record *core.Record, fsys *filesystem.System, fields []pbFieldInfo) (dbx.Params, error) {
	params := dbx.Params{}
	for _, fd := range fields {
		if fd.isFileExt {
			continue
		}
		if fd.isFile {
			filename, content, err := getFileContent(fsys, record, fd.pbKey)
			if err != nil {
				return nil, err
			}
			params[fd.dbKey] = content
			for _, fd2 := range fields {
				if fd2.isFileExt && fd2.pbKey == fd.pbKey {
					params[fd2.dbKey] = filename
					break
				}
			}
			continue
		}
		if fd.isJSON {
			b, err := json.Marshal(record.GetStringSlice(fd.pbKey))
			if err != nil {
				return nil, err
			}
			params[fd.dbKey] = b
			continue
		}
		switch fd.goType.Kind() {
		case reflect.String:
			params[fd.dbKey] = record.GetString(fd.pbKey)
		case reflect.Int, reflect.Int64:
			params[fd.dbKey] = record.GetInt(fd.pbKey)
		case reflect.Bool:
			params[fd.dbKey] = record.GetBool(fd.pbKey)
		default:
			params[fd.dbKey] = record.GetString(fd.pbKey)
		}
	}
	return params, nil
}

func dumpCollection[T any](app core.App, fsys *filesystem.System, db dbx.Builder, sourceTable string) error {
	app.Logger().Debug(fmt.Sprintf("Dumping %v", sourceTable))
	records, err := app.FindAllRecords(sourceTable)
	if err != nil {
		return err
	}

	fields := mustGetFieldInfo[T]()
	for _, s := range records {
		params, err := dumpItem[T](s, fsys, fields)
		if err != nil {
			return err
		}
		if _, err := db.Insert(sourceTable, params).Execute(); err != nil {
			return err
		}
	}

	app.Logger().Debug(fmt.Sprintf("Dumped %v", sourceTable))
	return nil
}
