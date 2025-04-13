import { queryOptions } from '@tanstack/react-query';

import { pbClient } from '@/api/pocketbase';
import { ArtifactTypePlans } from '@/api/types';

export const ARTIFACT_TYPE_PLANS_QUERY_KEY = ['artifactTypePlans'];
export const ARTIFACT_TYPE_PLANS_QUERY_PARAMS = queryOptions({
  queryKey: ARTIFACT_TYPE_PLANS_QUERY_KEY,
  queryFn: () =>
    pbClient.collection<ArtifactTypePlans>('artifactTypePlans').getFullList(),
});
