import { atom, useAtomValue } from 'jotai';

import { plansArrayAtom } from './plans';

export const weaponPlansAtom = atom((get) => {
  return get(plansArrayAtom).flatMap((p) => p.weaponPlans ?? []);
});

export function useWeaponPlans() {
  return useAtomValue(weaponPlansAtom);
}
