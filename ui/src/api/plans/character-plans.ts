import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';
import { notifyWithRetry } from '@/lib/notify-with-retry';

import { queryClient } from '../queryClient';
import { PLANS_QUERY } from './plans';

export function newCharacterPlansMutationKey(id: string) {
  return ['characterPlans', id];
}

type MutationParams = {
  id: string;
  characterId: string;
  order: number;
};
export function useNewCharacterPlanMutation(params: MutationParams) {
  const mutation = useMutation({
    mutationKey: newCharacterPlansMutationKey(params.id),
    mutationFn: () =>
      pbClient
        .collection<CharacterPlans>('characterPlans')
        .create(newCharacterPlan(params.characterId, params.order)),
    onSuccess(newPlan) {
      queryClient.setQueryData(PLANS_QUERY.queryKey, (data) => {
        if (!data) {
          console.error(
            'useNewCharacterPlanMutation got empty plans array on success',
          );
          return;
        }

        return produce(data, (plans) => {
          plans.push(newPlan);
          plans.sort((a, b) => a.order - b.order);
        });
      });
    },
    onError: notifyWithRetry(
      (v) => void mutation.mutate(v),
      () => void mutation.reset(),
    ),
  });
  return mutation;
}

export function newCharacterPlan(
  character: string,
  order: number,
): Omit<CharacterPlans, 'id'> {
  if (!pbClient.authStore.record) {
    throw new Error('User should be authorized at this point');
  }
  return {
    collectionId: '',
    collectionName: '',
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
