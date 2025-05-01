import { MutationKey, useMutation } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import {
  applyPatches,
  castDraft,
  createDraft,
  Patch,
  produce,
  produceWithPatches,
  WritableDraft,
} from 'immer';
import { useEffect, useState } from 'react';
import { useImmerReducer } from 'use-immer';

import { pbClient } from '@/api/pocketbase';
import { removeByPredMut } from '@/lib/array-remove-mut';
import { notifyWithRetry } from '@/lib/notify-with-retry';

import { queryClient } from '../queryClient';
import { PLANS_QUERY } from './plans';

interface CreateAction<T> {
  type: 'create';
  id: string;
  value: T;
}
interface UpdateAction<T> {
  type: 'update';
  id: string;
  value: T;
  patches: Patch[];
}
interface DeleteAction {
  type: 'delete';
  id: string;
}
type MutationAction<T> = CreateAction<T> | UpdateAction<T> | DeleteAction;

type CurrentMutationAction<T> = MutationAction<T> & {
  state: 'scheduled' | 'pending' | 'error';
};
interface MutationReducerState<T> {
  meta: { collectionName: string };
  pending: MutationAction<T>[];
  current: CurrentMutationAction<T> | null;
}
interface MarkCurrentAction {
  type: 'markCurrent';
  value: 'done' | 'error' | 'pending' | 'scheduled';
}
type MutationReducerActions<T> = MutationAction<T> | MarkCurrentAction;

export type OptimisticArtifactTypePlans<T> = T & {
  isOptimistic?: boolean;
};

function updatesReducer<T>(
  state: WritableDraft<MutationReducerState<T>>,
  action: MutationReducerActions<T>,
) {
  const addOrSetCurrent = (action: MutationAction<T>) => {
    if (!state.current) {
      state.current = castDraft({
        ...action,
        state: 'scheduled',
      });
    } else {
      state.pending.push(castDraft(action));
    }
  };
  const findExistingUpdateIndex = (id: string) =>
    state.pending.findIndex((p) => p.id == id);
  switch (action.type) {
    case 'create': {
      addOrSetCurrent(action);
      break;
    }
    case 'update': {
      const i = findExistingUpdateIndex(action.id);
      if (i >= 0) {
        const update = state.pending[i];
        if (update.type == 'delete' || update.type == 'create') break;
        update.value = castDraft(action.value);
        update.patches.push(...action.patches);
      } else {
        addOrSetCurrent(action);
      }
      break;
    }
    case 'delete': {
      const i = findExistingUpdateIndex(action.id);
      if (i >= 0) {
        const update = state.pending[i];
        if (update.type == 'delete' || update.type == 'create') break;
        state.pending.splice(i, 1);
      } else {
        addOrSetCurrent(action);
      }
      break;
    }
    case 'markCurrent':
      switch (action.value) {
        case 'done':
          state.current = null;
          break;
        case 'pending':
          if (state.current) {
            state.current.state = 'pending';
          } else {
            console.error(
              `(${state.meta.collectionName}) requested to change current action state to 'pending', but current action is gone`,
            );
          }
          break;
        case 'error':
          if (state.current) {
            state.current.state = 'error';
          } else {
            console.error(
              `(${state.meta.collectionName}) requested to change current action state to 'error', but current action is gone`,
            );
          }
          break;
        case 'scheduled': {
          if (state.current) {
            state.current.state = 'pending';
          } else {
            console.error(
              `(${state.meta.collectionName}) requested to change current action state to 'scheduled', but current action is gone`,
            );
          }
        }
      }
      break;
  }
}

export function useCollectionMutation<T>(
  collectionName: string,
  planId: string,
  artfactSets?: T[],
  mutationKey?: MutationKey,
) {
  const [updates, dispatch] = useImmerReducer<
    MutationReducerState<T>,
    MutationReducerActions<T>,
    string
  >(updatesReducer, collectionName, (collectionName) => ({
    meta: { collectionName },
    pending: [],
    current: null,
  }));
  const [shadowRecords, setShadowRecords] = useState<
    OptimisticArtifactTypePlans[] | null
  >(null);

  const mutation = useMutation({
    mutationKey,
    async mutationFn(variables: MutationAction) {
      switch (variables.type) {
        case 'create':
          return pbClient
            .collection<ArtifactSetsPlans>('artifactSetsPlans')
            .create({
              ...variables.value,
              id: undefined,
            });
        case 'update':
          return pbClient
            .collection<ArtifactSetsPlans>('artifactSetsPlans')
            .update(
              variables.value.id,
              applyPatches(variables.value, variables.patches),
            );
        case 'delete':
          await pbClient
            .collection<ArtifactSetsPlans>('artifactSetsPlans')
            .delete(variables.value);
          return;
      }
    },
    async onSuccess(data, action) {
      switch (action.type) {
        case 'create':
          if (!data) {
            console.error('useArtifactSetsMutation got empty data on success');
            return;
          }
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                'useArtifactSetsMutation got empty plans array on success',
              );
              return;
            }
            return produce(plans, (plans) => {
              const plan = plans.find((p) => p.id == planId);
              if (!plan) {
                console.error(
                  "useArtifactSetsMutation could not find plan it's intended to update",
                );
                return;
              }
              plan.artifactSetsPlans ??= [];
              plan.artifactSetsPlans.push(data);
            });
          });
          break;

        case 'update':
          if (!data) {
            console.error('useArtifactSetsMutation got empty data on success');
            return;
          }
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                'useArtifactSetsMutation got empty plans array on success',
              );
              return;
            }
            return produce(plans, (plans) => {
              const plan = plans.find((p) => p.id == planId);
              if (!plan?.artifactSetsPlans) {
                console.error(
                  "useArtifactSetsMutation could not find plan?.artifactSetsPlans it's intended to update",
                );
                return;
              }
              const index = plan.artifactSetsPlans.findIndex(
                (p) => p.id == data.id,
              );
              if (index < 0) {
                console.error(
                  "useArtifactSetsMutation could not find artifactSetsPlans it's intended to update",
                );
                return;
              }
              plan.artifactSetsPlans[index] = {
                ...plan.artifactSetsPlans[index],
                ...data,
              };
            });
          });
          break;

        case 'delete':
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                'useArtifactSetsMutation got empty plans array on success',
              );
              return;
            }
            return produce(plans, (plans) => {
              const plan = plans.find((p) => p.id == planId);
              if (!plan?.artifactSetsPlans) {
                console.error(
                  "useArtifactSetsMutation could not find plan?.artifactSetsPlans it's intended to update",
                );
                return;
              }
              removeByPredMut(
                plan.artifactSetsPlans,
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
      artfactSets?.filter((p) => !toDelete.has(p.id)) ?? []
    ).concat(Array.from(newRecords.values()));
    setShadowRecords(records);
  };

  useEffect(() => {
    updateShadowRecords();
  }, [artfactSets]);

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

  const createHandler = (value: Pick<ArtifactSetsPlans, 'artifactSets'>) => {
    const id = Date.now().toString();
    const ts = new Date().toString();
    const action: CreateAction = {
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

  const updateHandler = (
    artifactSet: ArtifactSetsPlans,
    cb: (v: WritableDraft<ArtifactSetsPlans>) => void,
  ) => {
    // need mux
    const existingUpdate = pendingUpdates.current.find(
      (u) =>
        (u.type == 'delete' && u.value == artifactSet.id) ||
        (u.type == 'update' && u.value.id == artifactSet.id),
    );
    switch (existingUpdate?.type) {
      case 'delete':
        return;
      case 'update': {
        const patches = existingUpdate.patches;
        const current = applyPatches(artifactSet, patches);
        const [newPlan, newPatches] = produceWithPatches(
          current,
          (d) => void cb(d),
        );
        patches.push(...newPatches);
        return;
      }
      default: {
        const action: UpdateAction = {
          type: 'update',
          value: A,
        };
      }
    }
  };

  const deleteHandler = (value: string) => {
    const existingUpdate = pendingUpdates.current.find(
      (u) => u.type == 'delete' && u.value == value,
    );
    if (existingUpdate) return;
    const action: DeleteAction = {
      type: 'delete',
      value,
    };
    mutate(action);
  };

  return {
    records:
      shadowRecords ??
      (artfactSets as OptimisticArtifactTypePlans[] | undefined) ??
      [],
    create: createHandler,
    update: updateHandler,
    delete: deleteHandler,
    isPending: mutation.isPending,
  };
}
