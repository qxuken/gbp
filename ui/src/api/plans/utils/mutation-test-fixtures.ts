import type { Plans, WeaponPlans } from '@/api/types';

export function plan(id = 'plan-a'): Plans {
  return {
    id,
    user: 'user-a',
    character: 'character-a',
    complete: false,
    order: 1,
    constellationCurrent: 0,
    constellationTarget: 0,
    levelCurrent: 1,
    levelTarget: 90,
    talentAtkCurrent: 1,
    talentAtkTarget: 10,
    talentSkillCurrent: 1,
    talentSkillTarget: 10,
    talentBurstCurrent: 1,
    talentBurstTarget: 10,
    substats: [],
    note: '',
    created: new Date(0),
    updated: new Date(0),
    weaponPlans: [weapon()],
  };
}

export function weapon(id = 'weapon-a'): WeaponPlans {
  return {
    id,
    characterPlan: 'plan-a',
    weapon: 'sword',
    levelCurrent: 1,
    levelTarget: 90,
    refinementCurrent: 1,
    refinementTarget: 5,
    tag: 'none',
    order: 1,
    created: new Date(0),
    updated: new Date(0),
  };
}
