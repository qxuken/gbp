import type { Patch } from '../types';

export function cmpGameVersion(
  a: string,
  b: string,
  patchMap: Map<string, Patch>,
): number {
  const pa = patchMap.get(a);
  const pb = patchMap.get(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  return pa.major !== pb.major ? pa.major - pb.major : pa.patch - pb.patch;
}
export function byVersionAndRarity<T extends { patch: string; rarity: number }>(
  patchMap: Map<string, Patch>,
): (a: T, b: T) => number {
  return (a, b) => {
    const versionCmp = cmpGameVersion(b.patch, a.patch, patchMap); // desc
    if (versionCmp !== 0) return versionCmp;
    return a.rarity - b.rarity; // asc
  };
}
