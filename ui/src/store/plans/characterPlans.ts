import { atomWithQuery } from 'jotai-tanstack-query';

import { CHARACTER_PLANS_QUERY_PARAMS } from '@/api/plans/characterPlans';

export const characterPlansAtom = atomWithQuery(
  () => CHARACTER_PLANS_QUERY_PARAMS,
);
