import { atom, useAtomValue } from 'jotai';
import { atomWithImmer } from 'jotai-immer';
import { atomWithMutation, atomWithQuery } from 'jotai-tanstack-query';

import { PLANS_QUERY_PARAMS } from '@/api/plans/plans';
import { pbClient } from '@/api/pocketbase';
import { Plans } from '@/api/types';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { store } from '@/store/jotai-store';

export const plansQueryAtom = atomWithQuery(() => PLANS_QUERY_PARAMS);

export const plansAtom = atomWithImmer(new Map<string, Plans>());

store.sub(plansQueryAtom, () => {
  const res = store.get(plansQueryAtom);
  if (!res.isSuccess) return;
  store.set(plansAtom, (plans) => {
    plans.clear();
    for (const item of res.data) {
      plans.set(item.id, item);
    }
  });
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
    store.set(plansAtom, (plans) => {
      for (const plan of reorderedPlans) {
        const original = plans.get(plan.id);
        if (original && original.order !== plan.order) {
          original.order = plan.order;
        }
      }
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

export function usePlansisLoading() {
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
