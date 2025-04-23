import { useMemo } from 'react';

import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';

import { usePlans } from './plans';

export function useArtifactTypePlans() {
  const plans = usePlans();
  return useMemo(
    () => plans.flatMap((p) => p.artifactTypePlans ?? []),
    [plans],
  );
}

export function useSpecialsByArtifactTypePlansMap() {
  const items = useArtifactTypePlans();
  return useMemo(() => {
    const acc = new Map<string, Set<string>>();
    for (const it of items) {
      mapGetOrSetDefault(acc, it.artifactType, () => new Set<string>()).add(
        it.special,
      );
    }
    return acc;
  }, [items]);
}
