import { useLiveQuery } from 'dexie-react-hooks';
import {
  createContext,
  PropsWithChildren,
  use,
  useEffect,
  useMemo,
} from 'react';

import { createRecordsMap } from '@/lib/create-records-map';

import {
  ArtifactSets,
  ArtifactTypes,
  CharacterRoles,
  Characters,
  DomainsOfBlessing,
  Elements,
  PlansCollections,
  Specials,
  Weapons,
  WeaponTypes,
} from '../types';
import { db } from './db';
import { reloadDictionaries } from './loader';

interface DictionaryCollectionValue<Value> {
  items: Value[];
  map: Map<string, Value>;
}

function arrayToDictionaryCollectionValue<Value extends { id: string }>(
  items: Value[],
): DictionaryCollectionValue<Value> {
  return {
    items,
    map: createRecordsMap(items),
  };
}

interface DictionaryContext {
  plansCollections: DictionaryCollectionValue<PlansCollections>;
  elements: DictionaryCollectionValue<Elements>;
  specials: DictionaryCollectionValue<Specials> & {
    substats: Specials[];
  };
  characterRoles: DictionaryCollectionValue<CharacterRoles>;
  weaponTypes: DictionaryCollectionValue<WeaponTypes>;
  weapons: DictionaryCollectionValue<Weapons>;
  characters: DictionaryCollectionValue<Characters>;
  artifactSets: DictionaryCollectionValue<ArtifactSets>;
  artifactTypes: DictionaryCollectionValue<ArtifactTypes>;
  domainsOfBlessing: DictionaryCollectionValue<DomainsOfBlessing> & {
    byArtifactSetId: Map<string, DomainsOfBlessing>;
  };
}

export function getDomainsByArtifactSetId(items: DomainsOfBlessing[]) {
  const acc = new Map<string, DomainsOfBlessing>();
  for (const it of items) {
    for (const set of it.artifactSets) {
      acc.set(set, it);
    }
  }
  return acc;
}

const dictionaryContextInitialValue: DictionaryContext = {
  plansCollections: { items: [], map: new Map() },
  elements: { items: [], map: new Map() },
  specials: { items: [], map: new Map(), substats: [] },
  characterRoles: { items: [], map: new Map() },
  weaponTypes: { items: [], map: new Map() },
  weapons: { items: [], map: new Map() },
  characters: { items: [], map: new Map() },
  artifactSets: { items: [], map: new Map() },
  artifactTypes: { items: [], map: new Map() },
  domainsOfBlessing: { items: [], map: new Map(), byArtifactSetId: new Map() },
};

const DictionaryContext = createContext(dictionaryContextInitialValue);

export function DictionaryProvider({ children }: PropsWithChildren) {
  const value: DictionaryContext = useLiveQuery(
    async () => {
      const [
        plansCollections,
        elements,
        specials,
        characterRoles,
        weaponTypes,
        weapons,
        characters,
        artifactSets,
        artifactTypes,
        domainsOfBlessing,
      ] = await Promise.all([
        db.plansCollections.toArray().then(arrayToDictionaryCollectionValue),
        db.elements.toArray().then(arrayToDictionaryCollectionValue),
        db.specials
          .orderBy('order')
          .toArray()
          .then(arrayToDictionaryCollectionValue),
        db.characterRoles.toArray().then(arrayToDictionaryCollectionValue),
        db.weaponTypes.toArray().then(arrayToDictionaryCollectionValue),
        db.weapons
          .orderBy('rarity')
          .reverse()
          .toArray()
          .then(arrayToDictionaryCollectionValue),
        db.characters
          .orderBy('rarity')
          .reverse()
          .toArray()
          .then(arrayToDictionaryCollectionValue),
        db.artifactSets
          .orderBy('rarity')
          .reverse()
          .toArray()
          .then(arrayToDictionaryCollectionValue),
        db.artifactTypes
          .orderBy('order')
          .toArray()
          .then(arrayToDictionaryCollectionValue),
        db.domainsOfBlessing.toArray().then(arrayToDictionaryCollectionValue),
      ]);
      return {
        plansCollections,
        elements,
        specials: {
          ...specials,
          substats: specials.items.filter((s) => s.substat == 1),
        },
        characterRoles,
        weaponTypes,
        weapons,
        characters,
        artifactSets,
        artifactTypes,
        domainsOfBlessing: {
          ...domainsOfBlessing,
          byArtifactSetId: getDomainsByArtifactSetId(domainsOfBlessing.items),
        },
      };
    },
    [],
    dictionaryContextInitialValue,
  );
  return (
    <DictionaryContext.Provider value={value}>
      {children}
    </DictionaryContext.Provider>
  );
}

type CollectionValueHooks<Value> = [
  () => Value[],
  (id: string, reportMissing?: boolean) => Value | undefined,
  () => Map<string, Value>,
];

function createCollectionValueHooks<C extends keyof DictionaryContext>(
  collectionName: C,
): CollectionValueHooks<DictionaryContext[C]['items'][number]> {
  return [
    function useItems() {
      const value = use(DictionaryContext);
      return value[collectionName].items;
    },
    function useItem(id: string, reportMissing = true) {
      const value = use(DictionaryContext);
      const item = useMemo(
        () => value[collectionName].map.get(id),
        [value, id],
      );

      useEffect(() => {
        if (!item && reportMissing) {
          reloadDictionaries();
        }
      }, [item, reportMissing]);

      return item;
    },
    function useMap() {
      const value = use(DictionaryContext);
      return value[collectionName].map;
    },
  ];
}

export const [
  usePlansCollections,
  usePlansCollectionsItem,
  usePlansCollectionsMap,
] = createCollectionValueHooks('plansCollections');

export const [useElements, useElementsItem, useElementsMap] =
  createCollectionValueHooks('elements');

export const [useSpecials, useSpecialsItem, useSpecialsMap] =
  createCollectionValueHooks('specials');

export function useSubstats() {
  const value = use(DictionaryContext);
  return value.specials.substats;
}

export const [useCharacterRoles, useCharacterRolesItem, useCharacterRolesMap] =
  createCollectionValueHooks('characterRoles');

export const [useWeaponTypes, useWeaponTypesItem, useWeaponTypesMap] =
  createCollectionValueHooks('weaponTypes');

export const [useWeapons, useWeaponsItem, useWeaponsMap] =
  createCollectionValueHooks('weapons');

export const [useCharacters, useCharactersItem, useCharactersMap] =
  createCollectionValueHooks('characters');

export const [useArtifactSets, useArtifactSetsItem, useArtifactSetsMap] =
  createCollectionValueHooks('artifactSets');

export const [useArtifactTypes, useArtifactTypesItem, useArtifactTypesMap] =
  createCollectionValueHooks('artifactTypes');

export const [
  useDomainsOfBlessing,
  useDomainsOfBlessingItem,
  useDomainsOfBlessingMap,
] = createCollectionValueHooks('domainsOfBlessing');

export function useDomainsOfBlessingMapByArtifactSetId() {
  return use(DictionaryContext).domainsOfBlessing.byArtifactSetId;
}
