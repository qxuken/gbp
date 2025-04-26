import { useMemo, createContext, PropsWithChildren, use } from 'react';

import { useCharactersMap } from '@/api/dictionaries/hooks';
import { reloadDictionaries } from '@/api/dictionaries/loader';
import { usePlans } from '@/api/plans/plans';
import { CharacterPlans, Characters } from '@/api/types';

import { useCharacterFilterFn } from './filters';
import { PendingPlan, usePendingPlans } from './pendingPlans';

const MAX_ITEMS = 130;
const MAX_PENDING_ITEMS = 2;

export type PlansRenderItem =
  | {
    type: 'committed';
    plan: CharacterPlans;
    character: Characters;
    order: number;
  }
  | {
    type: 'pending';
    plan: PendingPlan;
    character: Characters;
    order: number;
    visible: boolean;
  }
  | { type: 'create'; order: number; plansCount: number };

interface RenderingItemsContext {
  items: PlansRenderItem[];
  total: number;
}
const RenderingItemsContext = createContext<RenderingItemsContext | null>(null);

type Props = PropsWithChildren<{ page: number; perPage: number }>;
export function RenderingItemsProvider({ children, page, perPage }: Props) {
  const characters = useCharactersMap();
  const plans = usePlans();
  const pendingPlans = usePendingPlans();
  const filter = useCharacterFilterFn();

  const plansRenderItems: PlansRenderItem[] = useMemo(
    () =>
      plans
        .filter((plan) => {
          const character = characters.get(plan.character);
          if (!character) {
            reloadDictionaries();
            return false;
          }
          return filter(character, plan);
        })
        .map((plan) => ({
          type: 'committed',
          plan,
          character: characters.get(plan.character)!,
          order: plan.order,
        })),
    [plans, filter, characters],
  );

  const pendingPlansRenderItems: PlansRenderItem[] = useMemo(
    () =>
      pendingPlans
        .filter((pending) => {
          const character = characters.get(pending.characterId);
          if (!character) {
            reloadDictionaries();
            return false;
          }
          return filter(character);
        })
        .map((plan) => ({
          type: 'pending',
          plan,
          character: characters.get(plan.characterId)!,
          order: plan.order,
          visible: false,
        })),
    [pendingPlans, characters, filter],
  );

  const renderItems = useMemo(() => {
    const renderItems = plansRenderItems.concat(pendingPlansRenderItems);
    renderItems.sort((a, b) => a.order - b.order);

    if (
      plansRenderItems.length <= MAX_ITEMS - pendingPlansRenderItems.length &&
      pendingPlansRenderItems.length <= MAX_PENDING_ITEMS
    ) {
      renderItems.push({
        type: 'create',
        order: Infinity,
        plansCount: plansRenderItems.length,
      });
    }

    return renderItems;
  }, [plansRenderItems, pendingPlansRenderItems]);

  const paginatedRenderItems = useMemo(() => {
    const startIndex = perPage * (page - 1);
    const endIndex = perPage * page;
    const isWithinBounds = (i: number) => startIndex <= i && i < endIndex;

    return renderItems
      .filter((it, i) => it.type === 'pending' || isWithinBounds(i))
      .map((it, i) =>
        it.type == 'pending' ? { ...it, visible: isWithinBounds(i) } : it,
      );
  }, [renderItems, perPage, page]);

  const value = useMemo(
    () => ({
      items: paginatedRenderItems,
      total: renderItems.length,
    }),
    [paginatedRenderItems, renderItems],
  );

  return (
    <RenderingItemsContext.Provider value={value}>
      {children}
    </RenderingItemsContext.Provider>
  );
}

export function useRenderingPlanItems() {
  const context = use(RenderingItemsContext);
  if (!context) {
    throw new Error(
      'useRenderingPlanItems should be inside RenderingItemsContext',
    );
  }
  return context.items;
}

export function useRenderingPlanTotal() {
  const context = use(RenderingItemsContext);
  if (!context) {
    throw new Error(
      'useRenderingPlanTotal should be inside RenderingItemsContext',
    );
  }
  return context.total;
}
