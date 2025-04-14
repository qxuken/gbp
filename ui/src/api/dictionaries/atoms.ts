import { liveQuery } from 'dexie';
import { atom, useAtomValue } from 'jotai';
import { atomWithObservable } from 'jotai/utils';
import { useMemo } from 'react';

import { createMapAtom } from '@/lib/create-map-atom';

import { DomainsOfBlessing } from '../types';
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

export const specialsMapAtom = createMapAtom(specialsAtom);

export function useSpecialsMap() {
  return useAtomValue(specialsMapAtom);
}

export function useSpecialsItem(id: string) {
  const map = useAtomValue(specialsMapAtom);
  return useMemo(() => map.get(id), [map, id]);
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

export function useCharacters() {
  return useAtomValue(charactersAtom);
}

export const charactersMapAtom = createMapAtom(charactersAtom);

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

export const artifactSetsMapAtom = createMapAtom(artifactSetsAtom);

export function useArtifactSet(id: string) {
  const map = useAtomValue(domainsOfBlessingMapAtom);
  return useMemo(() => map.get(id), [id, map]);
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

export const domainsOfBlessingMapAtom = createMapAtom(domainsOfBlessingAtom);

export function useDomainOfBlessing(id: string) {
  const map = useAtomValue(domainsOfBlessingMapAtom);
  return useMemo(() => map.get(id), [id, map]);
}

export const domainsBySetAtom = atom((get) => {
  const items = get(domainsOfBlessingAtom);
  const acc = new Map<string, DomainsOfBlessing>();
  for (const it of items) {
    for (const set of it.artifactSets) {
      acc.set(set, it);
    }
  }
  return acc;
});

export function useDomainsBySet() {
  return useAtomValue(domainsBySetAtom);
}
