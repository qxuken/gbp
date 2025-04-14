import { atom, useAtomValue } from 'jotai';

import { plansArrayAtom } from './plans';

export const artifactSetsPlansAtom = atom((get) => {
  return get(plansArrayAtom).flatMap((p) => p.artifactSetsPlans ?? []);
});

export function useArtifactSetsPlans() {
  return useAtomValue(artifactSetsPlansAtom);
}
