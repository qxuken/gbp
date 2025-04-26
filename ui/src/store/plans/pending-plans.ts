import { create } from 'zustand';

export type PendingPlan = {
  id: string;
  characterId: string;
  order: number;
};

interface State {
  items: PendingPlan[];
}

interface Actions {
  add(characterId: string, order: number): void;
  remove(plan: PendingPlan): void;
}

export const usePendingPlansStore = create<State & Actions>((set) => ({
  items: [],
  add: (characterId, order) => {
    const plan = {
      id: Date.now().toString(),
      characterId,
      order,
    };
    set((state) => ({
      items: [...state.items, plan],
    }));
  },
  remove: (plan) =>
    set((state) => ({ items: state.items.filter((it) => it.id != plan.id) })),
}));

export function usePendingPlans() {
  return usePendingPlansStore((s) => s.items);
}

export function useAddPendingPlans() {
  return usePendingPlansStore((s) => s.add);
}

export function useRemovePendingPlans() {
  return usePendingPlansStore((s) => s.remove);
}
