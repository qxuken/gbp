import Dexie, { type EntityTable } from 'dexie';

import type {
  ArtifactSets,
  ArtifactTypes,
  CharacterRoles,
  Characters,
  Elements,
  Specials,
  Weapons,
  WeaponTypes,
} from './types';

type Collection = {
  id: string;
  name: string;
};

type Config = {
  key: string;
  value: string;
};

export const DICTIONARY_VERSION_CONFIG_KEY = 'dictionaryVersion';

export const DB_COLLECTION_MAPPING = {
  elements: 'elements',
  specials: 'specials',
  characterRoles: 'characterRoles',
  weaponTypes: 'weaponTypes',
  weapons: 'weapons',
  characters: 'characters',
  artifactSets: 'artifactSets',
  artifactTypes: 'artifactTypes',
} as const;
export type DBCollections = keyof typeof DB_COLLECTION_MAPPING;
export type PBCollections = (typeof DB_COLLECTION_MAPPING)[DBCollections];

export type DB = Dexie & {
  config: EntityTable<Config, 'key'>;
  collectionIds: EntityTable<Collection, 'id'>;
  elements: EntityTable<Elements, 'id'>;
  specials: EntityTable<Specials, 'id'>;
  characterRoles: EntityTable<CharacterRoles, 'id'>;
  weaponTypes: EntityTable<WeaponTypes, 'id'>;
  weapons: EntityTable<Weapons, 'id'>;
  characters: EntityTable<Characters, 'id'>;
  artifactSets: EntityTable<ArtifactSets, 'id'>;
  artifactTypes: EntityTable<ArtifactTypes, 'id'>;
};

export const db = new Dexie('Dictionaries') as DB;

db.version(1).stores({
  config: '++key, value',
  collectionIds: '++name, id',
  elements: '++id, name, color, inverseTextColor, icon',
  specials: '++id, name',
  characterRoles: '++id, name',
  weaponTypes: '++id, name, icon',
  weapons: '++id, name, icon, weaponType, special, rarity',
  characters: '++id, name, icon, element, weaponType, special, rarity',
  artifactSets: '++id, name, icon, rarity',
  artifactTypes: '++id, name, icon, specials',
});
