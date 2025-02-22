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

export const DB_COLLECTION_MAPPING = {
  elements: 'elements',
  specials: 'specials',
  characterRoles: 'character_roles',
  weaponTypes: 'weapon_types',
  weapons: 'weapons',
  characters: 'characters',
  artifactSets: 'artifact_sets',
  artifactTypes: 'artifact_types',
} as const;

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
  elements: '++id, name, color, inverse_text_color, icon',
  specials: '++id, name',
  characterRoles: '++id, name',
  weaponTypes: '++id, name, icon',
  weapons: '++id, name, icon, weapon_type, special, rarity',
  characters: '++id, name, icon, element, weapon_type, special, rarity',
  artifactSets: '++id, name, icon, rarity',
  artifactTypes: '++id, name, icon, specials',
});
