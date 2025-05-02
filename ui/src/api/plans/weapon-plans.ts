import { useMemo } from 'react';

import { WeaponPlans } from '../types';
import { usePlans, useSharedPendingPlansCollectionReporter } from './plans';
import {
  OptimisticRecord,
  usePlanCollectionAccessor,
  useCollectionMutation,
} from './utils/use-collection-mutation';

export function useWeaponPlans() {
  const plans = usePlans();
  return useMemo(() => plans.flatMap((p) => p.weaponPlans ?? []), [plans]);
}

export function newWeaponPlansMutation(planId: string) {
  return ['plans', planId, 'weaponPlans'];
}

export type OptimisticWeaponPlans = OptimisticRecord<WeaponPlans>;

export function useWeaponPlansMutation(
  planId: string,
  weaponPlans?: WeaponPlans[],
  disabled?: boolean,
) {
  const collectionGetter = usePlanCollectionAccessor('weaponPlans', planId);
  const [onPendingChange, onErrorChange] =
    useSharedPendingPlansCollectionReporter('weaponPlans', planId);
  const mutation = useCollectionMutation(
    'weaponPlans',
    collectionGetter,
    weaponPlans,
    disabled,
    newWeaponPlansMutation(planId),
    {
      postUpdate(v) {
        v.sort((a, b) => a.order - b.order);
      },
      onPendingChange,
      onErrorChange,
    },
  );

  const createHandler = (weapon: string) => {
    const id = Date.now().toString();
    const ts = new Date();
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
