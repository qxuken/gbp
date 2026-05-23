import Dexie, { type EntityTable } from 'dexie';

import type {
  ArtifactSets,
  ArtifactTypes,
  CharacterRoles,
  Characters,
  DomainsOfBlessing,
  Elements,
  Patch,
  PlansCollections,
  Specials,
  Weapons,
  WeaponTypes,
} from '../types';

type Config = {
  key: string;
  value: string;
};

export const DICTIONARY_VERSION_CONFIG_KEY = 'dictionaryVersion';

export type DBCollectionValues = {
  config: EntityTable<Config, 'key'>;
  plansCollections: EntityTable<PlansCollections, 'name'>;
  elements: EntityTable<Elements, 'id'>;
  specials: EntityTable<Specials, 'id'>;
  characterRoles: EntityTable<CharacterRoles, 'id'>;
  weaponTypes: EntityTable<WeaponTypes, 'id'>;
  weapons: EntityTable<Weapons, 'id'>;
  characters: EntityTable<Characters, 'id'>;
  artifactSets: EntityTable<ArtifactSets, 'id'>;
  artifactTypes: EntityTable<ArtifactTypes, 'id'>;
  domainsOfBlessing: EntityTable<DomainsOfBlessing, 'id'>;
  patch: EntityTable<Patch, 'id'>;
};
export const DB_COLLECTIONS = [
  'elements',
  'specials',
  'characterRoles',
  'weaponTypes',
  'weapons',
  'characters',
  'artifactSets',
  'artifactTypes',
  'domainsOfBlessing',
  'patch',
] as const;
export type DBCollections = (typeof DB_COLLECTIONS)[number];

export type DB = Dexie & DBCollectionValues;

export const db = new Dexie('Dictionaries') as DB;

db.version(2).stores({
  config: '++key, value',
  plansCollections: '++name, id',
  elements: '++id, name, color, inverseTextColor, icon',
  specials: '++id, name, substat, order',
  characterRoles: '++id, name',
  weaponTypes: '++id, name, icon',
  weapons: '++id, name, icon, weaponType, special, rarity, patch',
  characters: '++id, name, icon, element, weaponType, special, rarity, patch',
  artifactSets: '++id, name, icon, rarity, patch, useless',
  artifactTypes: '++id, name, order, icon, specials',
  domainsOfBlessing: '++id, name, artifactSets',
  patch: '++id, major, patch',
});
