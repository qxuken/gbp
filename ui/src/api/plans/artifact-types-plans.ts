import { useMemo } from 'react';

import { ArtifactTypePlans } from '@/api/types';

import { usePlans } from './plans';
import {
  OptimisticRecord,
  usePlansInnerCollectionMutation,
} from './utils/use-plans-inner-collection-mutation';

export function useArtifactTypePlans() {
  const plans = usePlans();
  return useMemo(
    () => plans.flatMap((p) => p.artifactTypePlans ?? []),
    [plans],
  );
}

export function newArtifactTypesPlansMutation(planId: string) {
  return ['plans', planId, 'artifactTypesPlans'];
}

export type OptimisticArtifactTypePlans = OptimisticRecord<ArtifactTypePlans>;

export function useArtifactTypesPlansMutation(
  planId: string,
  artfactTypes?: ArtifactTypePlans[],
) {
  const mutation = usePlansInnerCollectionMutation(
    'artifactTypePlans',
    'artifactTypePlans',
    planId,
    artfactTypes,
    newArtifactTypesPlansMutation(planId),
  );

  const createHandler = (
    value: Pick<ArtifactTypePlans, 'artifactType' | 'special'>,
  ) => {
    const id = Date.now().toString();
    const ts = new Date().toString();
    mutation.create({
      id,
      created: ts,
      updated: ts,
      characterPlan: planId,
      ...value,
    });
  };

  return { ...mutation, create: createHandler, update: undefined };
}
