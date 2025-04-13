import { atom, useAtomValue } from 'jotai';
import { atomWithImmer } from 'jotai-immer';
import { atomWithQuery } from 'jotai-tanstack-query';

import { PLANS_QUERY_PARAMS } from '@/api/plans/plans';
import { Plans } from '@/api/types';
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

export const plansArrayAtom = atom((get) => {
  const items = get(plansAtom);
  return Array.from(items.values());
});

export function usePlans() {
  return useAtomValue(plansArrayAtom);
}
