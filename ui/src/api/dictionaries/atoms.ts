import { liveQuery } from 'dexie';
import { Atom, atom, useAtomValue } from 'jotai';
import { atomWithObservable } from 'jotai/utils';
import { useMemo } from 'react';

import { db } from './db';

export const elementsAtom = atomWithObservable(
  () => liveQuery(() => db.elements.toArray()),
  {
    initialValue: () => [],
  },
);

export function useElements() {
  return useAtomValue(elementsAtom);
}

export const specialsAtom = atomWithObservable(
  () => liveQuery(() => db.specials.orderBy('order').toArray()),
  {
    initialValue: () => [],
  },
);

export function useSpecials() {
  return useAtomValue(specialsAtom);
}

export const characterRolesAtom = atomWithObservable(
  () => liveQuery(() => db.characterRoles.toArray()),
  {
    initialValue: () => [],
  },
);

export function useCharacterRoles() {
  return useAtomValue(characterRolesAtom);
}

export const weaponTypesAtom = atomWithObservable(
  () => liveQuery(() => db.weaponTypes.toArray()),
  {
    initialValue: () => [],
  },
);

export function useWeaponTypes() {
  return useAtomValue(weaponTypesAtom);
}

export const weaponsAtom = atomWithObservable(
  () => liveQuery(() => db.weapons.toArray()),
  {
    initialValue: () => [],
  },
);

export function useWeapons() {
  return useAtomValue(weaponsAtom);
}

export const charactersAtom = atomWithObservable(
  () => liveQuery(() => db.characters.toArray()),
  {
    initialValue: () => [],
  },
);

export const charactersMapAtom = createMapAtom(charactersAtom);

export function useCharacters() {
  return useAtomValue(charactersAtom);
}

export function useCharactersMap() {
  return useAtomValue(charactersMapAtom);
}

export function useCharactersItem(id: string) {
  const map = useAtomValue(charactersMapAtom);
  return useMemo(() => map.get(id), [map, id]);
}

export const artifactSetsAtom = atomWithObservable(
  () => liveQuery(() => db.artifactSets.toArray()),
  {
    initialValue: () => [],
  },
);

export function useArtifactSets() {
  return useAtomValue(artifactSetsAtom);
}

export const artifactTypesAtom = atomWithObservable(
  () => liveQuery(() => db.artifactTypes.orderBy('order').toArray()),
  {
    initialValue: () => [],
  },
);

export function useArtifactTypes() {
  return useAtomValue(artifactTypesAtom);
}

export const domainsOfBlessingAtom = atomWithObservable(
  () => liveQuery(() => db.domainsOfBlessing.toArray()),
  {
    initialValue: () => [],
  },
);

export function useDomainsOfBlessing() {
  return useAtomValue(domainsOfBlessingAtom);
}

function createMapAtom<T extends { id: string }>(ca: Atom<T[]>) {
  return atom((get) => {
    const items = get(ca);
    return new Map(items.map((it) => [it.id, it]));
  });
}
