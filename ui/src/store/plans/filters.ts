import { atom, useAtom, useAtomValue } from 'jotai';

import { charactersMapAtom } from '@/api/dictionaries/atoms';

import { plansArrayAtom } from './plans';

export type TBuildFilter = {
  name: string;
  elements: Set<string>;
  weaponTypes: Set<string>;
  characters: Set<string>;
  /** Key: artifact type, Value: set of specials */
  artifactTypeSpecials: Map<string, Set<string>>;
};

export const availableFiltersAtom = atom((get) => {
  const plans = get(plansArrayAtom);
  const characters = get(charactersMapAtom);
  const values = {
    elements: new Set<string>(),
    weaponTypes: new Set<string>(),
    characters: new Set<string>(),
  };
  for (const item of plans) {
    const character = characters.get(item.character);
    if (!character) {
      continue;
    }
    if (character.element) {
      values.elements.add(character.element);
    }
    values.weaponTypes.add(character.weaponType);
    values.characters.add(character.id);
  }
  return values;
});

export const filtersAtom = atom({
  name: '',
  elements: new Set(),
  characters: new Set(),
  weaponTypes: new Set(),
  artifactTypeSpecials: new Map(),
} as TBuildFilter);

export const filtersEnabledAtom = atom((get) => {
  const filters = get(filtersAtom);
  return (
    filters.name.length > 0 ||
    filters.elements.size > 0 ||
    filters.weaponTypes.size > 0 ||
    filters.artifactTypeSpecials.size > 0 ||
    filters.characters.size > 0
  );
});

export function useFilters() {
  return useAtom(filtersAtom);
}

export function useAvailableFilters() {
  return useAtomValue(availableFiltersAtom);
}

export function useFiltersEnabled() {
  return useAtomValue(filtersEnabledAtom);
}
