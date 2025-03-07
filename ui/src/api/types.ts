export interface Users {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

// Dictionaries

export interface Elements {
  id: string;
  name: string;
  color: string;
  inverseTextColor?: boolean;
  icon: string;
}

export interface Specials {
  id: string;
  name: string;
}

export interface CharacterRoles {
  id: string;
  name: string;
}

export interface WeaponTypes {
  id: string;
  name: string;
  icon: string;
}

export interface Weapons {
  id: string;
  name: string;
  icon: string;
  weaponType: string;
  special?: string;
  rarity: number;
}

export interface Characters {
  id: string;
  name: string;
  icon: string;
  element?: string;
  weaponType: string;
  special: string;
  rarity: number;
}

export interface ArtifactSets {
  id: string;
  name: string;
  icon: string;
  rarity: number;
}

export interface ArtifactTypes {
  id: string;
  name: string;
  icon: string;
  specials: string[];
}

// Plans

export interface CharacterPlans {
  id: string;
  user: string;
  character: string;
  characterRole?: string;
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
  artifactSets: string[];
}

export interface TeamPlans {
  id: string;
  characterPlan: string;
  characters: string[];
}

export interface WeaponPlans {
  id: string;
  characterPlan: string;
  weapon: string;
  levelCurrent: number;
  levelTarget: number;
  refinementCurrent: number;
  refinementTarget: number;
}

export interface ArtifactTypePlans {
  id: string;
  characterPlan: string;
  artifactType: string;
  special: string;
}
