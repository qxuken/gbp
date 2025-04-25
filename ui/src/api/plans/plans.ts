import {
  queryOptions,
  useMutation,
  useMutationState,
  useQuery,
} from '@tanstack/react-query';
import { produce } from 'immer';
import { useMemo } from 'react';

import { pbClient } from '@/api/pocketbase';
import { queryClient } from '@/api/queryClient';
import { Plans } from '@/api/types';
import { createRecordsMap } from '@/lib/create-records-atom';
import { notifyWithRetry } from '@/lib/notify-with-retry';

export const PLANS_QUERY = queryOptions({
  queryKey: ['plans'],
  queryFn: () => pbClient.collection<Plans>('plans').getFullList(),
  initialData: [],
});

export const PLANS_REORDERING_MUTATION_KEY = ['plans', 'reorder'];

export function usePlans() {
  const query = useQuery(PLANS_QUERY);
  return query.data;
}

export function usePlansIsLoading() {
  const query = useQuery(PLANS_QUERY);
  return query.isLoading;
}

export function usePlansMap() {
  const query = useQuery(PLANS_QUERY);
  return useMemo(() => createRecordsMap(query.data), [query.data]);
}

export function useReorderPlans() {
  const plansMap = usePlansMap();

  const { mutate, reset } = useMutation({
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
    onSuccess: async (res) => {
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
      reset();
    },
    onError: notifyWithRetry(
      (v) => void mutate(v),
      () => void reset(),
    ),
  });
  return mutate;
}

const reorderPlansGoodStatus = new Set(['idle', 'success']);
export function useReorderPlansIsPending() {
  const vals = useMutationState({
    filters: { mutationKey: PLANS_REORDERING_MUTATION_KEY },
    select: (data) => !reorderPlansGoodStatus.has(data.state.status),
  });
  return vals.at(-1) ?? false;
}
