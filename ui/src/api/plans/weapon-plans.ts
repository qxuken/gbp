import { useMemo } from 'react';

import { WeaponPlans } from '../types';
import { usePlans } from './plans';
import {
  OptimisticRecord,
  usePlansInnerCollectionMutation,
} from './utils/use-plans-inner-collection-mutation';

export function useWeaponPlans() {
  const plans = usePlans();
  return useMemo(() => plans.flatMap((p) => p.weaponPlans ?? []), [plans]);
}

export function newWeaponPlansMutation(planId: string) {
  return ['plans', planId, 'weaponPlans'];
}

export type OptimisticWeaponPlans = OptimisticRecord<WeaponPlans>;

export function useWeaponMutation(
  planId: string,
  weaponPlans?: WeaponPlans[],
  disabled?: boolean,
) {
  const mutation = usePlansInnerCollectionMutation(
    'weaponPlans',
    'weaponPlans',
    planId,
    weaponPlans,
    disabled,
    newWeaponPlansMutation(planId),
  );

  const createHandler = (weapon: string) => {
    const id = Date.now().toString();
    const ts = new Date().toString();
    mutation.create({
      id,
      created: ts,
      updated: ts,
      characterPlan: planId,
      levelCurrent: 0,
      levelTarget: 90,
      refinementCurrent: 1,
      refinementTarget: 5,
      weapon,
      order: mutation.records.length + 1,
    });
  };

  return { ...mutation, create: createHandler };
}

export function useWeaponPlansReorderMutation() {
  const {
    variables,
    mutate: reorderWeapons,
    isPending: reorderIsPending,
    reset,
  } = useMutation({
    mutationFn(items: ShortItem[]) {
      const batch = pbClient.createBatch();
      for (const it of items) {
        batch
          .collection('weaponPlans')
          .update(it.id, { order: it.order }, { fields: 'id, weapon, order' });
      }
      return batch.send();
    },
    onSuccess: async (data) => {
      const items = data.map((it) => it.body);
      await queryClient.setQueryData(queryKey, items);
      reset();
    },
    onError: notifyWithRetry((v) => {
      reorderWeapons(v);
    }),
  });
}
