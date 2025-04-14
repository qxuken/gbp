import { Atom, atom } from 'jotai';

export function createMapAtom<T extends { id: string }>(ca: Atom<T[]>) {
  return atom((get) => {
    const items = get(ca);
    return new Map(items.map((it) => [it.id, it]));
  });
}
