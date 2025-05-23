import { useDomainsOfBlessingMapByArtifactSetId } from '@/api/dictionaries/hooks';
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';

import { useArtifactSetsPlans } from './artifact-sets-plans';
import { usePlansMap } from './plans';

export interface DomainsByArtifactSets {
  domain: string;
  characters: string[];
  artifactSets: string[];
}

export function useDomainsByArtifactSets() {
  const domainsBySet = useDomainsOfBlessingMapByArtifactSetId();
  const plans = usePlansMap();
  const artifactSetsPlans = useArtifactSetsPlans();

  const domainsWithSets = new Map<
    string,
    { characters: Set<string>; artifactSets: Set<string> }
  >();

  for (const item of artifactSetsPlans) {
    for (const artifactSet of item.artifactSets) {
      const domain = domainsBySet.get(artifactSet);
      const plan = plans.get(item.characterPlan);
      if (!domain || !plan) {
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
