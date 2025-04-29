import {
  queryOptions,
  useMutation,
  useMutationState,
  useQuery,
} from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import { produce } from 'immer';
import { useMemo } from 'react';

import { pbClient } from '@/api/pocketbase';
import { queryClient } from '@/api/queryClient';
import { Plans } from '@/api/types';
import { createRecordsMap } from '@/lib/create-records-atom';
import { notifyWithRetry } from '@/lib/notify-with-retry';

import { newArtifactTypesPlansMutation } from './artifact-types-plans';
import { newUpdateCharacterPlanMutationKey } from './character-plans';

export const PLANS_QUERY = queryOptions({
  queryKey: ['plans'],
  queryFn: () => pbClient.collection<Plans>('plans').getFullList(),
});

export const PLANS_REORDERING_MUTATION_KEY = ['plans', 'reorder'];

export function usePlans() {
  const query = useQuery(PLANS_QUERY);
  return query.data ?? [];
}

export function usePlansMap() {
  const plans = usePlans();
  return useMemo(() => createRecordsMap(plans), [plans]);
}

export function usePlansIsLoading() {
  const query = useQuery(PLANS_QUERY);
  return query.isLoading;
}

export function useReorderPlans() {
  const plansMap = usePlansMap();

  const mutation = useMutation({
    mutationKey: PLANS_REORDERING_MUTATION_KEY,
    async mutationFn(reorderedPlans: Plans[]) {
      const batch = pbClient.createBatch();
      for (const plan of reorderedPlans) {
        const original = plansMap.get(plan.id)!;
        if (original.order !== plan.order) {
          batch
            .collection('characterPlans')
            .update(plan.id, { order: plan.order }, { fields: 'id,order' });
        }
      }
      const res = await batch.send();
      if (res.some((r) => r.status !== 200)) {
        throw new Error('Some requests are failed');
      }
      return res;
    },
    onSuccess(res) {
      const reorderedPlans = createRecordsMap<{ id: string; order: number }>(
        res.map((items) => items.body),
      );
      queryClient.setQueryData(PLANS_QUERY.queryKey, (data) => {
        if (!data) {
          console.error('useReorderPlans got empty plans array on success');
          return;
        }

        return produce(data, (plans) => {
          for (const it of plans) {
            const updated = reorderedPlans.get(it.id);
            if (updated && it.order != updated.order) {
              it.order = updated.order;
            }
          }
          plans.sort((a, b) => a.order - b.order);
        });
      });
      mutation.reset();
    },
    onError: notifyWithRetry(
      (v) => void mutation.mutate(v),
      () => void mutation.reset(),
    ),
  });

  useBlocker({
    shouldBlockFn: () => {
      if (!mutation.isPending) return false;
      const shouldLeave = confirm('Are you sure you want to leave?');
      return !shouldLeave;
    },
    disabled: !mutation.isPending,
  });

  return mutation.mutate;
}
export function useReorderPlansIsPending() {
  const vals = useMutationState({
    filters: { exact: true, mutationKey: PLANS_REORDERING_MUTATION_KEY },
    select: (data) => data.state.status == 'pending',
  });
  return Boolean(vals.at(-1));
}

export function usePlansItemIsLoading(planId: string) {
  const reorder = useMutationState({
    filters: { exact: true, mutationKey: PLANS_REORDERING_MUTATION_KEY },
    select: (data) => data.state.status == 'pending',
  });

  const updateCharacterPlan = useMutationState({
    filters: {
      mutationKey: newUpdateCharacterPlanMutationKey(planId),
    },
    select: (data) => data.state.status == 'pending',
  });

  return reorder.some(Boolean) || updateCharacterPlan.some(Boolean);
}
