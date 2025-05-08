package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3288403865")
		if err != nil {
			return err
		}
		var createdFieldId string
		if field := collection.Fields.GetByName("created"); field != nil {
			createdFieldId = field.GetId()
		}
		collection.Fields.Add(&core.AutodateField{
			Id:       createdFieldId,
			Name:     "created",
			Hidden:   false,
			System:   true,
			OnCreate: true,
		})

		var updatedFieldId string
		if field := collection.Fields.GetByName("updated"); field != nil {
			updatedFieldId = field.GetId()
		}
		collection.Fields.Add(&core.AutodateField{
			Id:       updatedFieldId,
			Name:     "updated",
			Hidden:   false,
			System:   true,
			OnCreate: true,
			OnUpdate: true,
		})

		var dumpFieldId string
		if field := collection.Fields.GetByName("dump"); field != nil {
			dumpFieldId = field.GetId()
		}
		collection.Fields.Add(&core.FileField{
			Id:        dumpFieldId,
			Name:      "dump",
			Required:  true,
			MaxSize:   1_048_576_000, // 1GB
			MaxSelect: 1,
		})

		return app.Save(collection)
	}, nil)
}
