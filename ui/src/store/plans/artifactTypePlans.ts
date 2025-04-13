import { atom, useAtomValue } from 'jotai';

import { plansArrayAtom } from './plans';

export const artifactTypePlansAtom = atom((get) => {
  const plans = get(plansArrayAtom);
  return plans.flatMap((p) => p.artifactTypePlans ?? []);
});

export function useArtifactTypePlans() {
  return useAtomValue(artifactTypePlansAtom);
}
