import { useLiveQuery } from 'dexie-react-hooks';
import {
  createContext,
  PropsWithChildren,
  use,
  useEffect,
  useMemo,
} from 'react';

import { createRecordsMap } from '@/lib/create-records-atom';

import {
  ArtifactSets,
  ArtifactTypes,
  CharacterRoles,
  Characters,
  DomainsOfBlessing,
  Elements,
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
  elements: DictionaryCollectionValue<Elements>;
  specials: DictionaryCollectionValue<Specials>;
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
  elements: { items: [], map: new Map() },
  specials: { items: [], map: new Map() },
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
        db.elements.toArray().then(arrayToDictionaryCollectionValue),
        db.specials
          .orderBy('order')
          .toArray()
          .then(arrayToDictionaryCollectionValue),
        db.characterRoles.toArray().then(arrayToDictionaryCollectionValue),
        db.weaponTypes.toArray().then(arrayToDictionaryCollectionValue),
        db.weapons.toArray().then(arrayToDictionaryCollectionValue),
        db.characters.toArray().then(arrayToDictionaryCollectionValue),
        db.artifactSets.toArray().then(arrayToDictionaryCollectionValue),
        db.artifactTypes
          .orderBy('order')
          .toArray()
          .then(arrayToDictionaryCollectionValue),
        db.domainsOfBlessing.toArray().then(arrayToDictionaryCollectionValue),
      ]);
      return {
        elements,
        specials,
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
  (id: string) => Value | undefined,
  () => Map<string, Value>,
];

function createCollectionValueHooks<C extends keyof DictionaryContext>(
  collectionName: C,
): CollectionValueHooks<DictionaryContext[C]['items'][number]> {
  return [
    function useItems() {
      const value = use(DictionaryContext);
      return useMemo(() => value[collectionName].items, [value]);
    },
    function useItem(id: string) {
      const value = use(DictionaryContext);
      const item = useMemo(
        () => value[collectionName].map.get(id),
        [value, id],
      );

      useEffect(() => {
        if (!item) {
          reloadDictionaries();
        }
      }, [item]);

      return item;
    },
    function useMap() {
      const value = use(DictionaryContext);
      return useMemo(() => value[collectionName].map, [value]);
    },
  ];
}

export const [useElements, useElementsItem, useElementsMap] =
  createCollectionValueHooks('elements');

export const [useSpecials, useSpecialsItem, useSpecialsMap] =
  createCollectionValueHooks('specials');

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
] = createCollectionValueHooks('artifactTypes');

export function useDomainsOfBlessingMapByArtifactSetId() {
  return use(DictionaryContext).domainsOfBlessing.byArtifactSetId;
}
