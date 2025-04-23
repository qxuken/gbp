import { queryOptions } from '@tanstack/react-query';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';

export const CHARACTER_PLANS_QUERY_KEY = ['characterPlans'];
export const CHARACTER_PLANS_QUERY_PARAMS = queryOptions({
  queryKey: CHARACTER_PLANS_QUERY_KEY,
  queryFn: () =>
    pbClient
      .collection<CharacterPlans>('characterPlans')
      .getFullList({ sort: 'order' }),
});

export function newCharacterPlan(
  id: string,
  character: string,
  order: number,
): CharacterPlans {
  if (!pbClient.authStore.record) {
    throw new Error('User should be authorized at this point');
  }
  return {
    collectionId: '',
    collectionName: '',
    id,
    user: pbClient.authStore.record.id,
    character,
    order,
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
  };
}
