import { queryOptions } from '@tanstack/react-query';

import { pbClient } from '@/api/pocketbase';
import { ArtifactSetsPlans } from '@/api/types';

export const ARTIFACT_SETS_PLANS_QUERY_KEY = [
  'characterPlans',
  'artifactSetsPlans',
];
export const ARTIFACT_SETS_PLANS_QUERY_PARAMS = queryOptions({
  queryKey: ARTIFACT_SETS_PLANS_QUERY_KEY,
  queryFn: () =>
    pbClient.collection<ArtifactSetsPlans>('artifactSetsPlans').getFullList(),
});
