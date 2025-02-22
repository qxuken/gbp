package models

import (
	"database/sql"

	"github.com/pocketbase/pocketbase/core"
)

// ensures that the Article struct satisfy the core.RecordProxy interface
var _ core.RecordProxy = (*AppSetting)(nil)

type AppSetting struct {
	core.BaseRecordProxy
}

func (a *AppSetting) Key() string {
	return a.GetString("key")
}

func (a *AppSetting) setKey(key string) {
	a.Set("key", key)
}

func (a *AppSetting) Value() string {
	return a.GetString("value")
}

func (a *AppSetting) ValueRaw() any {
	return a.Get("value")
}

func (a *AppSetting) SetValue(value string) {
	a.Set("value", value)
}

func (a *AppSetting) Delete(app core.App) error {
	return app.Delete(a)
}

func FindAppSettingsByKey(app core.App, key string) (*AppSetting, error) {
	appSetting := &AppSetting{}
	rec, err := app.FindFirstRecordByData(APP_SETTINGS_COLLECTION_NAME, "key", key)
	if err != nil {
		return nil, err
	}
	appSetting.SetProxyRecord(rec)
	return appSetting, nil
}

func CreateAppSettings(app core.App, key string, value string) (*AppSetting, error) {
	col, err := app.FindCollectionByNameOrId(APP_SETTINGS_COLLECTION_NAME)
	if err != nil {
		return nil, err
	}
	rec := core.NewRecord(col)
	appSetting := &AppSetting{}
	appSetting.SetProxyRecord(rec)
	appSetting.setKey(key)
	appSetting.SetValue(value)
	return appSetting, app.Save(appSetting)
}

func UpsertAppSettings(app core.App, key string, value string) (*AppSetting, error) {
	record, err := FindAppSettingsByKey(app, key)
	if err == sql.ErrNoRows {
		return CreateAppSettings(app, key, value)
	} else if err != nil {
		return nil, err
	}
	record.setKey(key)
	record.SetValue(value)
	return record, app.Save(record)
}
