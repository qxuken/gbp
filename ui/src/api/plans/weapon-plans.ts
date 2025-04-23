import { useMemo } from 'react';

import { usePlans } from './plans';

export function useWeaponPlans() {
  const plans = usePlans();
  return useMemo(() => plans.flatMap((p) => p.weaponPlans ?? []), [plans]);
}
