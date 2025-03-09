import type { RecordModel } from 'pocketbase';

export type WithOrder<T> = T & {
  order: number;
};

export interface OnlyId {
  id: string;
}

export interface Users extends RecordModel {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

// Dictionaries

export interface Elements extends RecordModel {
  id: string;
  name: string;
  color: string;
  inverseTextColor?: boolean;
  icon: string;
}

export interface Specials extends RecordModel {
  id: string;
  name: string;
}

export interface CharacterRoles extends RecordModel {
  id: string;
  name: string;
}

export interface WeaponTypes extends RecordModel {
  id: string;
  name: string;
  icon: string;
}

export interface Weapons extends RecordModel {
  id: string;
  name: string;
  icon: string;
  weaponType: string;
  special?: string;
  rarity: number;
}

export interface Characters extends RecordModel {
  id: string;
  name: string;
  icon: string;
  element?: string;
  weaponType: string;
  special: string;
  rarity: number;
}

export interface ArtifactSets extends RecordModel {
  id: string;
  name: string;
  icon: string;
  rarity: number;
}

export interface ArtifactTypes extends RecordModel {
  id: string;
  order: number;
  name: string;
  icon: string;
  specials: string[];
}

// Plans

export interface CharacterPlans extends RecordModel {
  id: string;
  user: string;
  character: string;
  characterRole?: string;
  order: number;
  constellationCurrent: number;
  constellationTarget: number;
  levelCurrent: number;
  levelTarget: number;
  talentAtkCurrent: number;
  talentAtkTarget: number;
  talentSkillCurrent: number;
  talentSkillTarget: number;
  talentBurstCurrent: number;
  talentBurstTarget: number;
  substats: string[];
  note: string;
}

export interface TeamPlans extends RecordModel {
  id: string;
  characterPlan: string;
  characters: string[];
}

export interface WeaponPlans extends RecordModel {
  id: string;
  characterPlan: string;
  weapon: string;
  levelCurrent: number;
  levelTarget: number;
  refinementCurrent: number;
  refinementTarget: number;
}

export interface ArtifactTypePlans extends RecordModel {
  id: string;
  characterPlan: string;
  artifactType: string;
  special: string;
}

export interface ArtifactSetsPlans extends RecordModel {
  id: string;
  characterPlan: string;
  artifactSets: string[];
}
