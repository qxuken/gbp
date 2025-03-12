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

type Config = {
  key: string;
  value: string;
};

export const DICTIONARY_VERSION_CONFIG_KEY = 'dictionaryVersion';

export const DB_COLLECTIONS = [
  'elements',
  'specials',
  'characterRoles',
  'weaponTypes',
  'weapons',
  'characters',
  'artifactSets',
  'artifactTypes',
] as const;
export type DBCollections = (typeof DB_COLLECTIONS)[number];

export type DB = Dexie & {
  config: EntityTable<Config, 'key'>;
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
  elements: '++id, name, color, inverseTextColor, icon',
  specials: '++id, name, substat, order',
  characterRoles: '++id, name',
  weaponTypes: '++id, name, icon',
  weapons: '++id, name, icon, weaponType, special, rarity',
  characters: '++id, name, icon, element, weaponType, special, rarity',
  artifactSets: '++id, name, icon, rarity',
  artifactTypes: '++id, name, order, icon, specials',
});
