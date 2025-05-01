import { useMemo } from 'react';

import { ArtifactSetsPlans } from '../types';
import { usePlans } from './plans';
import {
  OptimisticRecord,
  usePlansInnerCollectionMutation,
} from './utils/use-plans-inner-collection-mutation';

export function useArtifactSetsPlans() {
  const plans = usePlans();
  return useMemo(
    () => plans.flatMap((p) => p.artifactSetsPlans ?? []),
    [plans],
  );
}

export function newArtifactSetsPlansMutation(planId: string) {
  return ['plans', planId, 'artifactSetsPlans'];
}

export type OptimisticArtifactTypePlans = OptimisticRecord<ArtifactSetsPlans>;

export function useArtifactSetsMutation(
  planId: string,
  artifactSets?: ArtifactSetsPlans[],
  disabled?: boolean,
) {
  const mutation = usePlansInnerCollectionMutation(
    'artifactSetsPlans',
    'artifactSetsPlans',
    planId,
    artifactSets,
    disabled,
    newArtifactSetsPlansMutation(planId),
  );

  const createHandler = (value: Pick<ArtifactSetsPlans, 'artifactSets'>) => {
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

  return { ...mutation, create: createHandler };
}
