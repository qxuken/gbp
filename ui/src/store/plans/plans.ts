import { atom, useAtomValue } from 'jotai';
import {
  atomWithMutation,
  atomWithQuery,
  queryClientAtom,
} from 'jotai-tanstack-query';

import { PLANS_QUERY_PARAMS } from '@/api/plans/plans';
import { pbClient } from '@/api/pocketbase';
import { Plans } from '@/api/types';
import { notifyWithRetry } from '@/lib/notify-with-retry';

export const plansQueryAtom = atomWithQuery(() => PLANS_QUERY_PARAMS);

export const createPlanAtom = atom(null, (get, _set, plan: Plans) => {
  const client = get(queryClientAtom);
  client.setQueryData(PLANS_QUERY_PARAMS.queryKey, (data) => {
    if (!data) return;
    return [...data, plan];
  });
});

export const updatePlanAtom = atom(null, (get, _set, plan: Plans) => {
  const client = get(queryClientAtom);
  client.setQueryData(PLANS_QUERY_PARAMS.queryKey, (data) => {
    if (!data) return;
    return data.map((it) => (it.id == plan.id ? plan : it));
  });
});

export const deletePlanAtom = atom(null, (get, _set, plan: Plans) => {
  const client = get(queryClientAtom);
  client.setQueryData(PLANS_QUERY_PARAMS.queryKey, (data) => {
    if (!data) return;
    return data.filter((it) => it.id != plan.id);
  });
});

export const plansAtom = atom((get) => {
  const items = get(plansQueryAtom).data ?? [];
  const res = new Map<string, Plans>();
  for (const it of items) {
    res.set(it.id, it);
  }
  return res;
});

const reorderMutationAtom = atomWithMutation((get) => ({
  mutationFn(reorderedPlans: Plans[]) {
    const plans = get(plansAtom);
    const batch = pbClient.createBatch();
    for (const plan of reorderedPlans) {
      const original = plans.get(plan.id)!;
      if (original.order !== plan.order) {
        batch
          .collection('characterPlans')
          .update(plan.id, { order: plan.order });
      }
    }
    return batch.send();
  },
  onSuccess: async (_, reorderedPlans) => {
    const client = get(queryClientAtom);
    client.setQueryData(PLANS_QUERY_PARAMS.queryKey, (data) => {
      if (!data) return;
      return data.map((it, i) =>
        reorderedPlans[i] && it.id != reorderedPlans[i].id
          ? reorderedPlans[i]
          : it,
      );
    });

    get(reorderMutationAtom).reset();
  },
  onError: notifyWithRetry(
    (v) => {
      get(reorderMutationAtom).mutate(v);
    },
    () => {
      // check this behavior
      get(reorderMutationAtom).reset();
    },
  ),
}));

export const plansArrayAtom = atom((get) => {
  const reorderMutation = get(reorderMutationAtom);
  const items =
    reorderMutation.variables ?? Array.from(get(plansAtom).values());
  items.sort((a, b) => b.order - a.order);
  return items;
});

export function usePlans() {
  return useAtomValue(plansArrayAtom);
}

export function usePlansIsLoading() {
  const q = useAtomValue(plansQueryAtom);
  return q.isLoading;
}

export function useReorderPlans() {
  const val = useAtomValue(reorderMutationAtom);
  return val.mutate;
}

export function useReorderPlansIsPending() {
  const val = useAtomValue(reorderMutationAtom);
  return val.isPending;
}
