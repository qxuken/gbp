package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/qxuken/gbp/internals/models"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId(models.PLANS_VIEW_COLLECTION_NAME)
		if err != nil {
			return err
		}

		collection.ViewQuery = `
WITH WeaponPlansDetails AS (
  SELECT
    w1.characterPlan,
    (
      SELECT json_group_array(
               json_object(
                 'id', w2.id,
                 'created', w2.created,
                 'updated', w2.updated,
                 'characterPlan', w2.characterPlan,
                 'levelCurrent', w2.levelCurrent,
                 'levelTarget', w2.levelTarget,
                 'refinementCurrent', w2.refinementCurrent,
                 'refinementTarget', w2.refinementTarget,
                 'weapon', w2.weapon,
                 'order', w2."order",
                 'tag', w2.tag
               )
             )
      FROM (
             SELECT *
             FROM weaponPlans AS w2
             WHERE w2.characterPlan = w1.characterPlan
             ORDER BY w2."order"
           ) w2
    ) AS weaponPlanDetails
  FROM weaponPlans AS w1
  GROUP BY w1.characterPlan
),
ArtifactSetsPlansDetails AS (
  SELECT
    asp1.characterPlan,
    (
      SELECT json_group_array(
               json_object(
                 'id',            asp2.id,
                 'artifactSets',  asp2.artifactSets,
                 'order',         asp2."order",
                 'created',       asp2.created,
                 'updated',       asp2.updated,
                 'characterPlan', asp2.characterPlan
               )
             )
      FROM (
             SELECT *
             FROM artifactSetsPlans AS asp2
             WHERE asp2.characterPlan = asp1.characterPlan
             ORDER BY asp2."order"
           ) asp2
    ) AS artifactSetsPlanDetails
  FROM artifactSetsPlans AS asp1
  GROUP BY asp1.characterPlan
),
ArtifactTypePlansDetails AS (
  SELECT
    characterPlan,
    json_group_array(
      json_object(
        'id', id,
        'artifactType', artifactType,
        'created', created,
        'updated', updated,
        'special', special,
        'characterPlan', characterPlan
      )
    ) AS artifactTypePlanDetails
  FROM artifactTypePlans
  GROUP BY characterPlan
),
TeamPlansDetails AS (
  SELECT
    characterPlan,
    json_group_array(
      json_object(
        'id', id,
        'characters', characters,
        'created', created,
        'updated', updated,
        'characterPlan', characterPlan
      )
    ) AS teamPlans
  FROM teamPlans
  GROUP BY characterPlan
)
SELECT
  cp.character,
  cp.characterRole,
  cp.constellationCurrent,
  cp.constellationTarget,
  cp.created,
  cp.id,
  cp.levelCurrent,
  cp.levelTarget,
  cp.note,
  cp."order",
  cp.substats,
  cp.talentAtkCurrent,
  cp.talentAtkTarget,
  cp.talentBurstCurrent,
  cp.talentBurstTarget,
  cp.talentSkillCurrent,
  cp.talentSkillTarget,
  cp.updated,
  cp.user,
  wpd.weaponPlanDetails AS weaponPlans,
  atpd.artifactTypePlanDetails AS artifactTypePlans,
  aspd.artifactSetsPlanDetails AS artifactSetsPlans,
  tpd.teamPlans AS teamPlans
FROM characterPlans cp
LEFT JOIN WeaponPlansDetails wpd ON cp.id = wpd.characterPlan
LEFT JOIN ArtifactTypePlansDetails atpd ON cp.id = atpd.characterPlan
LEFT JOIN ArtifactSetsPlansDetails aspd ON cp.id = aspd.characterPlan
LEFT JOIN TeamPlansDetails tpd ON cp.id = tpd.characterPlan
ORDER BY cp."order";
`

		return app.Save(collection)
	}, nil)
}
