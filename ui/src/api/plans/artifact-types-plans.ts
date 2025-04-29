import { useMutation } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import { produce } from 'immer';
import { useEffect, useMemo, useRef, useState } from 'react';

import { pbClient } from '@/api/pocketbase';
import { ArtifactTypePlans } from '@/api/types';
import { removeByPredMut } from '@/lib/array-remove-mut';
import { notifyWithRetry } from '@/lib/notify-with-retry';

import { queryClient } from '../queryClient';
import { PLANS_QUERY, usePlans } from './plans';

export function useArtifactTypePlans() {
  const plans = usePlans();
  return useMemo(
    () => plans.flatMap((p) => p.artifactTypePlans ?? []),
    [plans],
  );
}

type CreateArtifactType = { type: 'create'; value: ArtifactTypePlans };
type DeleteArtifactType = { type: 'delete'; value: string };
type MutationAction = CreateArtifactType | DeleteArtifactType;

export function newArtifactTypesPlansMutation(planId: string) {
  return ['plans', planId, 'artifactTypesPlans'];
}

export interface OptimisticArtifactTypePlans extends ArtifactTypePlans {
  optimistic?: boolean;
}

export function useArtifactTypesPlansMutation(
  planId: string,
  artfactTypes?: ArtifactTypePlans[],
) {
  const pendingUpdates = useRef<MutationAction[]>([]);
  const [shadowRecords, setShadowRecords] = useState<
    OptimisticArtifactTypePlans[] | null
  >(null);

  const mutation = useMutation({
    mutationKey: newArtifactTypesPlansMutation(planId),
    async mutationFn(variables: MutationAction) {
      switch (variables.type) {
        case 'create':
          return pbClient
            .collection<ArtifactTypePlans>('artifactTypePlans')
            .create({
              ...variables.value,
              id: undefined,
            });
        case 'delete':
          await pbClient
            .collection<ArtifactTypePlans>('artifactTypePlans')
            .delete(variables.value);
          return;
      }
    },
    async onSuccess(data, action) {
      switch (action.type) {
        case 'create':
          if (!data) {
            console.error(
              'useArtifactTypesPlansMutation got empty data on success',
            );
            return;
          }
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                'useArtifactTypesPlansMutation got empty plans array on success',
              );
              return;
            }
            return produce(plans, (plans) => {
              const plan = plans.find((p) => p.id == planId);
              if (!plan) {
                console.error(
                  "useArtifactTypesPlansMutation could not find plan it's intended to update",
                );
                return;
              }
              plan.artifactTypePlans ??= [];
              plan.artifactTypePlans.push(data);
            });
          });
          break;

        case 'delete':
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                'useArtifactTypesPlansMutation got empty plans array on success',
              );
              return;
            }
            return produce(plans, (plans) => {
              const plan = plans.find((p) => p.id == planId);
              if (!plan?.artifactTypePlans) {
                console.error(
                  "useArtifactTypesPlansMutation could not find plan?.artifactTypePlans it's intended to update",
                );
                return;
              }
              removeByPredMut(
                plan.artifactTypePlans,
                (it) => it.id == action.value,
              );
            });
          });
          break;
      }
      const nextUpdate = pendingUpdates.current.shift();
      if (nextUpdate) {
        mutation.mutateAsync(nextUpdate);
      } else {
        mutation.reset();
      }
    },
    onError: notifyWithRetry((v) => {
      mutation.mutate(v);
    }),
  });

  const updateShadowRecords = (action?: MutationAction) => {
    if (pendingUpdates.current.length == 0 && !mutation.variables && !action) {
      return setShadowRecords(null);
    }
    const updates = [...pendingUpdates.current, mutation.variables, action];
    const toDelete = new Set(
      updates.filter((f) => f?.type == 'delete').map((f) => f.value),
    );
    const newRecords = new Map(
      updates
        .filter((f) => f?.type == 'create')
        .map((u) => [u.value.id, { ...u.value, optimistic: true }]),
    );
    const records: OptimisticArtifactTypePlans[] = (
      artfactTypes?.filter((p) => !toDelete.has(p.id)) ?? []
    ).concat(Array.from(newRecords.values()));
    setShadowRecords(records);
  };

  useEffect(() => {
    updateShadowRecords();
  }, [artfactTypes]);

  useBlocker({
    shouldBlockFn: () => {
      if (!mutation.isPending) return false;
      const shouldLeave = confirm('Are you sure you want to leave?');
      return !shouldLeave;
    },
    disabled: !mutation.isPending,
  });

  const mutate = (action: MutationAction) => {
    if (!mutation.isPending) {
      mutation.mutateAsync(action);
    } else {
      pendingUpdates.current.push(action);
    }
    updateShadowRecords(action);
  };

  const createHandler = (
    value: Pick<ArtifactTypePlans, 'artifactType' | 'special'>,
  ) => {
    const id = Date.now().toString();
    const ts = new Date().toString();
    const action: CreateArtifactType = {
      type: 'create',
      value: {
        id,
        created: ts,
        updated: ts,
        characterPlan: planId,
        ...value,
      },
    };
    mutate(action);
  };

  const deleteHandler = (value: string) => {
    const action: DeleteArtifactType = {
      type: 'delete',
      value,
    };
    mutate(action);
  };

  return {
    records:
      shadowRecords ??
      (artfactTypes as OptimisticArtifactTypePlans[] | undefined) ??
      [],
    create: createHandler,
    delete: deleteHandler,
    isPending: mutation.isPending,
  };
}
