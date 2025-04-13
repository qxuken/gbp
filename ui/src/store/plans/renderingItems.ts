import fuzzysearch from 'fuzzysearch';
import { atom, useAtomValue } from 'jotai';

import { charactersMapAtom } from '@/api/dictionaries/atoms';
import { CharacterPlans, Characters } from '@/api/types';

import { filtersAtom } from './filters';
import { PendingCharacter, pendingCharacterPlansAtom } from './pendingPlans';
import { plansArrayAtom, plansQueryAtom } from './plans';

const MAX_ITEMS = 130;
const MAX_PENDING_ITEMS = 3;

export type BuildsRenderItem =
  | { type: 'build'; build: CharacterPlans; order: number }
  | { type: 'pending'; pending: PendingCharacter; order: number }
  | { type: 'create'; order: number };

export const renderingPlanItemsAtom = atom((get) => {
  const res = get(plansQueryAtom);
  if (res.isError) return [];
  const plans = get(plansArrayAtom);
  const characters = get(charactersMapAtom);
  const pendingPlans = get(pendingCharacterPlansAtom);
  const filters = get(filtersAtom);

  const filter = (character: Characters) =>
    (filters.elements.size === 0 ||
      (character.element && filters.elements.has(character.element))) &&
    (filters.weaponTypes.size === 0 ||
      filters.weaponTypes.has(character.weaponType)) &&
    (!filters.name ||
      fuzzysearch(filters.name.toLowerCase(), character.name.toLowerCase()));

  const buildItems: BuildsRenderItem[] = plans
    .filter((build) => {
      const character = characters.get(build.character);
      if (!character) {
        return false;
      }
      return filter(character);
    })
    .map((build) => ({
      type: 'build',
      build,
      order: build.order,
    }));
  const pendingItems: BuildsRenderItem[] = ([] as PendingCharacter[])
    .filter((pending) => {
      const character = characters.get(pending.characterId);
      if (!character) {
        return false;
      }
      return filter(character);
    })
    .map((pending) => ({
      type: 'pending',
      pending,
      order: pending.order,
    }));
  const all = buildItems.concat(pendingItems);
  all.sort((a, b) => a.order - b.order);
  if (
    plans.length <= MAX_ITEMS - pendingPlans.length &&
    pendingPlans.length <= MAX_PENDING_ITEMS
  ) {
    all.push({ type: 'create', order: Infinity });
  }
  return all;
});

export function useRenderingPlanItems() {
  return useAtomValue(renderingPlanItemsAtom);
}
