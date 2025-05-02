import { useMemo } from 'react';

import { ArtifactSetsPlans } from '../types';
import { usePlans, useSharedPendingPlansCollectionReporter } from './plans';
import {
  OptimisticRecord,
  usePlanCollectionAccessor,
  useCollectionMutation,
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
    { debounceMS: 0, onPendingChange, onErrorChange },
  );

  const createHandler = (value: Pick<ArtifactSetsPlans, 'artifactSets'>) => {
    const id = Date.now().toString();
    const ts = new Date();
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
