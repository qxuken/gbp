import { atom, useAtomValue } from 'jotai';

import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';

import { plansArrayAtom } from './plans';

export const artifactTypePlansAtom = atom((get) => {
  return get(plansArrayAtom).flatMap((p) => p.artifactTypePlans ?? []);
});

export function useArtifactTypePlans() {
  return useAtomValue(artifactTypePlansAtom);
}

export const artifactTypesPlansSpecialsMapAtom = atom((get) => {
  const items = get(artifactTypePlansAtom);
  const acc = new Map<string, Set<string>>();
  for (const it of items) {
    mapGetOrSetDefault(acc, it.artifactType, () => new Set<string>()).add(
      it.special,
    );
  }
  return acc;
});

export function useArtifactTypesPlansSpecialsMap() {
  return useAtomValue(artifactTypesPlansSpecialsMapAtom);
}
