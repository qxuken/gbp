import {
  useMemo,
  createContext,
  PropsWithChildren,
  use,
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from 'react';

import { useCharactersMap } from '@/api/dictionaries/hooks';
import { Characters, Plans } from '@/api/types';

import { useCharacterFilterFn } from './filters';

export const MAX_ITEMS = 80;

interface RenderingItemsContext {
  page: number;
  perPage: number;
  total: number;
  setTotal: Dispatch<SetStateAction<number>>;
}
const RenderingItemsContext = createContext<RenderingItemsContext | null>(null);

type Props = PropsWithChildren<{ page: number; perPage: number }>;
export function RenderingItemsProvider({ children, page, perPage }: Props) {
  const [total, setTotal] = useState(-1);
  const value: RenderingItemsContext = useMemo(
    () => ({
      page,
      perPage,
      total,
      setTotal,
    }),
    [total, page, perPage],
  );

  return (
    <RenderingItemsContext.Provider value={value}>
      {children}
    </RenderingItemsContext.Provider>
  );
}

type PlansItem<T> = {
  type: 'plan';
  order: number;
  plan: T;
  character: Characters;
};

type CreateItem = {
  type: 'create';
  order: number;
};

export type PlansRenderItem<T> = PlansItem<T> | CreateItem;

export function useRenderingPlanItems<T extends Plans>(
  plans: T[],
): PlansRenderItem<T>[] {
  const context = use(RenderingItemsContext);
  if (!context) {
    throw new Error(
      'useRenderingPlanItems should be inside RenderingItemsContext',
    );
  }
  const characters = useCharactersMap();
  const filter = useCharacterFilterFn();

  const renderingItems = useMemo(() => {
    const items: PlansRenderItem<T>[] = plans
      .filter((plan) => {
        const character = characters.get(plan.character);
        return character && filter(character, plan);
      })
      .map((plan) => ({
        type: 'plan',
        order: plan.order,
        plan,
        character: characters.get(plan.character)!,
      }));

    if (items.length < MAX_ITEMS) {
      items.push({
        type: 'create',
        order: Infinity,
      });
    }

    return items;
  }, [plans, filter, characters]);

  const paginatedRenderItems = useMemo(() => {
    const startIndex = context.perPage * (context.page - 1);
    const endIndex = startIndex + context.perPage;

    return renderingItems.slice(startIndex, endIndex);
  }, [renderingItems, context.perPage, context.page]);

  useEffect(() => {
    if (context.total != renderingItems.length) {
      context.setTotal(renderingItems.length);
    }
  }, [renderingItems.length]);

  return paginatedRenderItems;
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
