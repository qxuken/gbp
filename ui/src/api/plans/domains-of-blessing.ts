import {
  useCharactersMap,
  useDomainsOfBlessingMapByArtifactSetId,
} from '@/api/dictionaries/hooks';
import { Characters, Plans } from '@/api/types';
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';

import { useArtifactSetsPlans } from './artifact-sets-plans';
import { usePlansMap } from './plans';

export interface DomainsByArtifactSets {
  domain: string;
  characters: string[];
  artifactSets: string[];
}

export function useDomainsByArtifactSets(
  includeComplete?: boolean,
  filter?: (character: Characters, plan?: Plans) => boolean,
) {
  const domainsBySet = useDomainsOfBlessingMapByArtifactSetId();
  const charactersMap = useCharactersMap();
  const plans = usePlansMap(includeComplete);
  const artifactSetsPlans = useArtifactSetsPlans(includeComplete);

  const domainsWithSets = new Map<
    string,
    { characters: Set<string>; artifactSets: Set<string> }
  >();

  for (const item of artifactSetsPlans) {
    const plan = plans.get(item.characterPlan);
    if (!plan) {
      continue;
    }
    const character = charactersMap.get(plan.character);
    if (!character || (filter && !filter(character, plan))) {
      continue;
    }
    for (const artifactSet of item.artifactSets) {
      const domain = domainsBySet.get(artifactSet);
      if (!domain) {
        continue;
      }
      const v = mapGetOrSetDefault(domainsWithSets, domain.id, () => ({
        characters: new Set<string>(),
        artifactSets: new Set<string>(),
      }));
      v.characters.add(plan.character);
      v.artifactSets.add(artifactSet);
    }
  }
  const res: DomainsByArtifactSets[] = Array.from(
    domainsWithSets.entries(),
  ).map(([domain, v]) => ({
    domain,
    characters: Array.from(v.characters),
    artifactSets: Array.from(v.artifactSets),
  }));
  res.sort((a, b) => b.characters.length - a.characters.length);
  return res;
}
