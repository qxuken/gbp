import type { RecordModel } from 'pocketbase';

import { ArtifactSets } from '@/components/plan-card/ui/artifact-sets';

export interface Users extends RecordModel {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

// Dictionaries

export interface PlansCollections {
  id: string;
  name: string;
}

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
  substat: number;
  order: number;
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

export interface DomainsOfBlessing extends RecordModel {
  id: string;
  name: string;
  artifactSets: string[];
}

export interface ArtifactTypes extends RecordModel {
  id: string;
  order: number;
  name: string;
  icon: string;
  specials: string[];
}

// Plans

export interface PlansExtra {
  artifactSetsPlans?: ArtifactSetsPlans[];
  artifactTypePlans?: ArtifactTypePlans[];
  weaponPlans?: WeaponPlans[];
  teamPlans?: TeamPlans[];
}

export interface Plans extends CharacterPlans, PlansExtra {}

export interface CharacterPlans {
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
  created: Date;
  updated: Date;
}

export interface TeamPlans {
  id: string;
  characterPlan: string;
  characters: string[];
  created: Date;
  updated: Date;
}

export interface WeaponPlans {
  id: string;
  characterPlan: string;
  weapon: string;
  levelCurrent: number;
  levelTarget: number;
  refinementCurrent: number;
  refinementTarget: number;
  tag: 'none' | 'current' | 'target';
  order: number;
  created: Date;
  updated: Date;
}

export interface ArtifactTypePlans {
  id: string;
  characterPlan: string;
  artifactType: string;
  special: string;
  created: Date;
  updated: Date;
}

export interface ArtifactSetsPlans {
  id: string;
  characterPlan: string;
  artifactSets: string[];
  created: Date;
  updated: Date;
}
