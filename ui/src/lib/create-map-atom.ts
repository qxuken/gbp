import { Atom, atom } from 'jotai';

import { createRecordsMap } from './create-records-atom';

export function createMapAtom<T extends { id: string }>(ca: Atom<T[]>) {
  return atom((get) => {
    const items = get(ca);
    return createRecordsMap(items);
  });
}
