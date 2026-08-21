package migrations

import (
	"fmt"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/qxuken/gbp/internals/models"
)

// Levels reach 100 (in steps of five past 90) and every talent caps at 13, so
// the stored ranges have to follow the game rather than the old 90/10 limits.
var characterPlansMaxUp = map[string]float64{
	"levelCurrent":     100,
	"levelTarget":      100,
	"talentAtkCurrent": 13,
	"talentAtkTarget":  13,
}

var characterPlansMaxDown = map[string]float64{
	"levelCurrent":     90,
	"levelTarget":      90,
	"talentAtkCurrent": 10,
	"talentAtkTarget":  10,
}

func setCharacterPlansMax(app core.App, maxByField map[string]float64) error {
	collection, err := app.FindCollectionByNameOrId(models.CHARACTER_PLANS_COLLECTION_NAME)
	if err != nil {
		return err
	}

	for name, max := range maxByField {
		field, ok := collection.Fields.GetByName(name).(*core.NumberField)
		if !ok {
			return fmt.Errorf("%s is not a number field", name)
		}
		field.Max = new(max)
	}

	return app.Save(collection)
}

// clampCharacterPlans pulls the stored values back into the given maxima,
// otherwise plans recorded above them stop validating and their cards can no
// longer be saved at all.
func clampCharacterPlans(app core.App, maxByField map[string]float64) error {
	for name, max := range maxByField {
		query := fmt.Sprintf(
			"UPDATE {{%s}} SET [[%s]] = {:max} WHERE [[%s]] > {:max}",
			models.CHARACTER_PLANS_COLLECTION_NAME, name, name,
		)
		if _, err := app.DB().NewQuery(query).Bind(dbx.Params{"max": max}).Execute(); err != nil {
			return err
		}
	}
	return nil
}

func init() {
	m.Register(func(app core.App) error {
		return setCharacterPlansMax(app, characterPlansMaxUp)
	}, func(app core.App) error {
		if err := clampCharacterPlans(app, characterPlansMaxDown); err != nil {
			return err
		}
		return setCharacterPlansMax(app, characterPlansMaxDown)
	})
}
