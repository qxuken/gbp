import { useMemo } from 'react';

import { ArtifactTypePlans } from '@/api/types';

import { usePlans, useSharedPendingPlansCollectionReporter } from './plans';
import {
  OptimisticRecord,
  usePlanCollectionAccessor,
  useCollectionMutation,
} from './utils/use-collection-mutation';

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
  disabled?: boolean,
) {
  const collectionGetter = usePlanCollectionAccessor(
    'artifactTypePlans',
    planId,
  );
  const [onPendingChange, onErrorChange] =
    useSharedPendingPlansCollectionReporter('artifactTypePlans', planId);
  const mutation = useCollectionMutation(
    'artifactTypePlans',
    collectionGetter,
    artfactTypes,
    disabled,
    newArtifactTypesPlansMutation(planId),
    { onPendingChange, onErrorChange },
  );

  const createHandler = (
    value: Pick<ArtifactTypePlans, 'artifactType' | 'special'>,
  ) => {
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

  return { ...mutation, create: createHandler, update: undefined };
}
