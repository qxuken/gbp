import { queryOptions, useQuery } from '@tanstack/react-query';

import { pbClient } from '@/api/pocketbase';
import { ArtifactSetsPlans } from '@/api/types';

const ARTIFACT_SETS_PLANS_QUERY_KEY = ['characterPlans', 'artifactSetsPlans'];
const ARTIFACT_SETS_PLANS_QUERY_PARAMS = queryOptions({
  queryKey: ARTIFACT_SETS_PLANS_QUERY_KEY,
  queryFn: () =>
    pbClient.collection<ArtifactSetsPlans>('artifactSetsPlans').getFullList(),
});

export function useArtifactSetsPlans() {
  return useQuery(ARTIFACT_SETS_PLANS_QUERY_PARAMS);
}
