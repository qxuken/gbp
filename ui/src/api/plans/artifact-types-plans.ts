import { useMemo } from 'react';

import { usePlans } from './plans';

export function useArtifactTypePlans() {
  const plans = usePlans();
  return useMemo(
    () => plans.flatMap((p) => p.artifactTypePlans ?? []),
    [plans],
  );
}
