import { Patch } from 'immer';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans, Plans } from '@/api/types';
import { identity } from '@/lib/indentity';

import {
  OptimisticRecord,
  useCollectionMutation,
} from './utils/use-collection-mutation';

export function newCharacterPlan(
  character: string,
  order: number,
): CharacterPlans {
  if (!pbClient.authStore.record) {
    throw new Error('User should be authorized at this point');
  }
  const id = Date.now().toString();
  const ts = new Date();
  return {
    id,
    created: ts,
    updated: ts,
    complete: false,
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

export type OptimisticPlans = OptimisticRecord<Plans>;

export const UPDATE_CHARACTER_PLAN_MUTATION_KEY = ['plans'];

const PLAN_TO_CHARACTER_PLAN_PATCHES: Patch[] = [
  { op: 'remove', path: ['artifactSetsPlans'] },
  { op: 'remove', path: ['artifactTypePlans'] },
  { op: 'remove', path: ['weaponPlans'] },
  { op: 'remove', path: ['teamPlans'] },
];

const MUTATION_DEBOUNCE_MS = 750;

export function useCharacterPlansMutation(plans: Plans[], disabled?: boolean) {
  const mutation = useCollectionMutation(
    'characterPlans',
    identity,
    plans,
    disabled,
    UPDATE_CHARACTER_PLAN_MUTATION_KEY,
    {
      debounceMS: MUTATION_DEBOUNCE_MS,
      serverPatches: PLAN_TO_CHARACTER_PLAN_PATCHES,
      postUpdate(v) {
        v.sort((a, b) => a.order - b.order);
      },
    },
  );

  const createHandler = (characterId: string) => {
    mutation.create(
      newCharacterPlan(
        characterId,
        mutation.records.at(-1)?.order ?? 1,
      ) as Plans,
    );
  };

  return {
    ...mutation,
    create: createHandler,
  };
}
