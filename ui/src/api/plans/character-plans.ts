import { useMutation } from '@tanstack/react-query';
import {
  applyPatches,
  Patch,
  produce,
  produceWithPatches,
  WritableDraft,
} from 'immer';
import { useEffect, useMemo, useRef, useState } from 'react';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans, Plans } from '@/api/types';
import { AsyncDebounce } from '@/lib/async-debounce';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { useRemovePendingPlans } from '@/store/plans/pending-plans';

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
  const removePendingPlan = useRemovePendingPlans();
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
      removePendingPlan(params);
    },
    onError: notifyWithRetry((v) => void mutation.mutate(v)),
  });
  return mutation;
}

function newUpdateCharacterPlanMutationKey(id: string) {
  return ['plans', id];
}

type UpdateAction = { type: 'update' } | { type: 'delete' };

const PLAN_TO_CHARACTER_PLAN_PATCHES: readonly Patch[] = [
  { op: 'remove', path: ['artifactSetsPlans'] },
  { op: 'remove', path: ['artifactTypePlans'] },
  { op: 'remove', path: ['weaponPlans'] },
  { op: 'remove', path: ['teamPlans'] },
  { op: 'remove', path: ['order'] },
];

export function useUpdateCharacterPlan(plan: Plans) {
  const [shadowRecord, setShadowRecord] = useState<Plans | null>(null);
  const patches = useRef<Patch[]>([]);
  const mutationKey = newUpdateCharacterPlanMutationKey(plan.id);
  const mutationDebouncer = useMemo(
    () =>
      new AsyncDebounce(async (plan: CharacterPlans) => {
        const size = patches.current.length;
        if (size == 0) console.error('update was called with empty patch list');

        const patchSlice = patches.current.concat(
          PLAN_TO_CHARACTER_PLAN_PATCHES,
        );
        const res = await pbClient
          .collection<CharacterPlans>('characterPlans')
          .update(plan.id, applyPatches(plan, patchSlice));
        patches.current.splice(0, size);
        return res;
      }, 1000),
    [plan.id],
  );

  const mutation = useMutation({
    mutationKey,
    async mutationFn(action: UpdateAction) {
      switch (action.type) {
        case 'update':
          return mutationDebouncer.run(plan);

        case 'delete':
          mutationDebouncer.cancel();
          await pbClient
            .collection<CharacterPlans>('characterPlans')
            .delete(plan.id);
          break;
      }
    },
    onSuccess(data, action) {
      switch (action.type) {
        case 'update':
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                'useUpdateCharacterPlan got empty plans array on success',
              );
              return;
            }
            return produce(plans, (plans) => {
              const planIndex = plans.findIndex((p) => p.id == plan.id);
              if (planIndex < 0) {
                console.error(
                  "useUpdateCharacterPlan could not find plan it's intended to update",
                );
                return;
              }
              plans[planIndex] = { ...plans[planIndex], ...data };
            });
          });
          if (patches.current.length > 0) {
            mutation.mutate({ type: 'update' });
          } else {
            setShadowRecord(null);
          }
          break;

        case 'delete':
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                'useUpdateCharacterPlan got empty plans array on success',
              );
              return;
            }
            return plans.filter((p) => p.id != plan.id);
          });
          break;
      }
    },
    onError: notifyWithRetry(
      (v) => void mutation.mutate(v),
      () => queryClient.invalidateQueries({ queryKey: PLANS_QUERY.queryKey }),
    ),
  });

  useEffect(() => {
    patches.current = [];
  }, [plan.id]);

  const updateHandler = (cb: (v: WritableDraft<CharacterPlans>) => void) => {
    if (mutation.variables?.type == 'delete') return;
    const current =
      patches.current.length > 0 ? applyPatches(plan, patches.current) : plan;
    const [newPlan, newPatches] = produceWithPatches(
      current,
      (d) => void cb(d),
    );
    patches.current.push(...newPatches);
    setShadowRecord(newPlan);
    mutation.mutateAsync({ type: 'update' });
  };

  const deleteHandler = () => {
    if (mutation.variables?.type == 'delete') return;
    mutation.mutateAsync({ type: 'delete' });
    setShadowRecord(null);
  };

  return {
    record: shadowRecord ?? plan,
    updateRecord: updateHandler,
    deleteRecord: deleteHandler,
    isPending: mutation.isPending,
    isDeleted: mutation.isSuccess && mutation.variables?.type == 'delete',
    isPendingDeletion:
      mutation.isPending && mutation.variables?.type == 'delete',
  };
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
