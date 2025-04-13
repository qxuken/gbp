import { atomWithQuery } from 'jotai-tanstack-query';

import { ARTIFACT_SETS_PLANS_QUERY_PARAMS } from '@/api/plans/artifactSetsPlans';

export const artifactSetsPlansAtom = atomWithQuery(
  () => ARTIFACT_SETS_PLANS_QUERY_PARAMS,
);
