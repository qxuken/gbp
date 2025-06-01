import { useMemo } from 'react';

import { ArtifactSetsPlans } from '../types';
import { usePlans, useSharedPendingPlansCollectionReporter } from './plans';
import {
  OptimisticRecord,
  useCollectionMutation,
  usePlanCollectionAccessor,
} from './utils/use-collection-mutation';

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

export function useArtifactSetsPlansMutation(
  planId: string,
  artifactSets?: ArtifactSetsPlans[],
  disabled?: boolean,
) {
  const collectionGetter = usePlanCollectionAccessor(
    'artifactSetsPlans',
    planId,
  );
  const [onPendingChange, onErrorChange] =
    useSharedPendingPlansCollectionReporter('artifactSetsPlans', planId);
  const mutation = useCollectionMutation(
    'artifactSetsPlans',
    collectionGetter,
    artifactSets,
    disabled,
    newArtifactSetsPlansMutation(planId),
    {
      postUpdate(v) {
        v.sort((a, b) => a.order - b.order);
      },
      onPendingChange,
      onErrorChange,
    },
  );

  const createHandler = (artifactSets: ArtifactSetsPlans['artifactSets']) => {
    const id = Date.now().toString();
    const ts = new Date();
    mutation.create({
      id,
      created: ts,
      updated: ts,
      characterPlan: planId,
      order: mutation.records.length + 1,
      artifactSets,
    });
  };

  return { ...mutation, create: createHandler };
}
