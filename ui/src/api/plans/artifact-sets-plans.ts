import { useMemo } from 'react';

import { usePlans } from './plans';

export function useArtifactSetsPlans() {
  const plans = usePlans();
  return useMemo(
    () => plans.flatMap((p) => p.artifactSetsPlans ?? []),
    [plans],
  );
}
