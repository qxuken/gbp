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
  inverse_text_color?: boolean;
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
  weapon_type: string;
  special?: string;
  rarity: number;
}

export interface Characters {
  id: string;
  name: string;
  icon: string;
  element?: string;
  weapon_type: string;
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
  character_role?: string;
  constellation_current?: number;
  constellation_target?: number;
  level_current?: number;
  level_target?: number;
  talent_atk_current?: number;
  talent_atk_target?: number;
  talent_skill_current?: number;
  talent_skill_target?: number;
  talent_burst_current?: number;
  talent_burst_target?: number;
  artifact_sets?: string[];
}

export interface TeamMembers {
  id: string;
  character: string;
  character_role?: string;
}

export interface TeamPlans {
  id: string;
  character_plan: string;
  team_members: string[];
}

export interface WeaponPlans {
  id: string;
  character_plan: string;
  weapon: string;
  level_current?: number;
  level_target?: number;
  refinement_current?: number;
  refinement_target?: number;
}

export interface ArtifactTypePlans {
  id: string;
  character_plan: string;
  artifact_type: string;
  special: string;
}
