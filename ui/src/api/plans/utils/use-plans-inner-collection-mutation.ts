import { MutationKey, useMutation } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import {
  applyPatches,
  castDraft,
  Patch,
  produce,
  produceWithPatches,
  WritableDraft,
} from 'immer';
import { useEffect, useMemo, useTransition } from 'react';
import { useImmerReducer } from 'use-immer';

import { pbClient } from '@/api/pocketbase';
import { removeByPredMut } from '@/lib/array-remove-mut';
import { notifyWithRetry } from '@/lib/notify-with-retry';

import { queryClient } from '../../queryClient';
import { Plans } from '../../types';
import { PLANS_QUERY } from '../plans';

const MARK_OPTIMISTIC_PATCH: Patch = {
  op: 'add',
  path: ['isOptimistic'],
  value: true,
};

const BLOCK_OPTIMISTIC_PATCH: Patch = {
  op: 'add',
  path: ['isOptimisticBlocked'],
  value: true,
};

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

export type OptimisticRecord<T> = T & {
  isOptimistic?: boolean;
  isOptimisticBlocked?: boolean;
};

function updatesReducer<T>(
  state: WritableDraft<MutationReducerState<T>>,
  action: MutationReducerActions<T>,
) {
  const addOrSetCurrent = (action: MutationAction<T>) => {
    if (!state.current) {
      state.current = castDraft({
        ...action,
        state: 'pending',
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
      }
      addOrSetCurrent(action);
      break;
    }
    case 'markCurrent':
      switch (action.value) {
        case 'done': {
          const next = state.pending.shift();
          state.current = next ? { ...next, state: 'pending' } : null;
          break;
        }
        case 'pending':
          if (state.current) {
            if (state.current.state == 'error') state.current.state = 'pending';
          } else {
            console.error(
              `(${state.meta.collectionName}) requested to change current action state to 'pending', but current action is gone`,
            );
          }
          break;
        case 'error':
          if (state.current) {
            if (state.current.state == 'scheduled')
              state.current.state = 'error';
          } else {
            console.error(
              `(${state.meta.collectionName}) requested to change current action state to 'error', but current action is gone`,
            );
          }
          break;
        case 'scheduled': {
          if (state.current) {
            if (state.current.state == 'pending')
              state.current.state = 'scheduled';
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

export function usePlansInnerCollectionMutation<
  Key extends keyof Pick<
    Plans,
    'artifactSetsPlans' | 'artifactTypePlans' | 'weaponPlans' | 'teamPlans'
  >,
  T extends Plans[Key] extends (infer T)[] | undefined
    ? { id: string } & T
    : { id: string },
>(
  collectionName: string,
  collectionAccessor: Key,
  planId: string,
  records?: T[],
  disabled?: boolean,
  mutationKey?: MutationKey,
  updateConfig?: {
    postUpdate?: (v: T[]) => void;
  },
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

  const mutation = useMutation({
    mutationKey,
    async mutationFn(variables: MutationAction<T>) {
      switch (variables.type) {
        case 'create':
          return pbClient.collection<T>(collectionName).create({
            ...variables.value,
            id: undefined,
          });
        case 'update':
          return pbClient
            .collection<T>(collectionName)
            .update(
              variables.id,
              applyPatches(variables.value, variables.patches),
            );
        case 'delete':
          await pbClient.collection<T>(collectionName).delete(variables.id);
          return;
      }
    },
    onMutate() {
      dispatch({ type: 'markCurrent', value: 'scheduled' });
    },
    async onSuccess(data, action) {
      switch (action.type) {
        case 'create':
          if (!data) {
            console.error(`${collectionName} got empty data on success`);
            return;
          }
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                `${collectionName} got empty plans array on success`,
              );
              return;
            }
            return produce(plans, (plans) => {
              const plan = plans.find((p) => p.id == planId);
              if (!plan) {
                console.error(
                  `${collectionName} could not find plan(${planId}) it's intended to update`,
                );
                return;
              }
              plan[collectionAccessor] ??= [];
              // @ts-expect-error Too much for ts (or me) to handle
              plan[collectionAccessor].push(data);
              // @ts-expect-error Too much for ts (or me) to handle
              updateConfig?.postUpdate?.(plan[collectionAccessor]);
            });
          });
          break;

        case 'update':
          if (!data) {
            console.error(`${collectionName} got empty data on success`);
            return;
          }
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                `${collectionName} got empty plans array on success`,
              );
              return;
            }
            return produce(plans, (plans) => {
              const plan = plans.find((p) => p.id == planId);
              if (!plan?.[collectionAccessor]) {
                console.error(
                  `${collectionName} could not find plan it's intended to update or ${collectionAccessor} is empty`,
                );
                return;
              }
              const index = plan[collectionAccessor].findIndex(
                (p) => p.id == data.id,
              );
              if (index < 0) {
                console.error(
                  `${collectionName} could not find ${collectionAccessor} it's intended to update`,
                );
                return;
              }
              plan[collectionAccessor][index] = {
                ...plan[collectionAccessor][index],
                ...data,
              };
              // @ts-expect-error Too much for ts (or me) to handle
              updateConfig?.postUpdate?.(plan[collectionAccessor]);
            });
          });
          break;

        case 'delete':
          queryClient.setQueryData(PLANS_QUERY.queryKey, (plans) => {
            if (!plans) {
              console.error(
                `${collectionName} got empty plans array on success`,
              );
              return;
            }
            return produce(plans, (plans) => {
              const plan = plans.find((p) => p.id == planId);
              if (!plan?.[collectionAccessor]) {
                console.error(
                  `${collectionName} could not find plan it's intended to update or ${collectionAccessor} is empty`,
                );
                return;
              }
              removeByPredMut(
                // @ts-expect-error Too much for ts (or me) to handle
                plan[collectionAccessor],
                (it) => it.id == action.id,
              );
            });
          });
          break;
      }
      dispatch({ type: 'markCurrent', value: 'done' });
    },
    onError(err) {
      dispatch({ type: 'markCurrent', value: 'error' });
      notifyWithRetry(() => {
        dispatch({ type: 'markCurrent', value: 'pending' });
      })(err);
    },
  });

  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      if (updates.current?.state == 'pending' && !disabled) {
        await mutation.mutateAsync(updates.current);
      }
    });
  }, [updates.current?.state, disabled]);

  const shadowRecords = useMemo(() => {
    if (updates.pending.length == 0 && !updates.current) {
      return null;
    }
    const pendingUpdates = [...updates.pending, updates.current];
    const newRecords = pendingUpdates
      .filter((f) => f?.type == 'create')
      .map((u) =>
        applyPatches(
          u.value,
          updates.current?.id == u.id
            ? [MARK_OPTIMISTIC_PATCH, BLOCK_OPTIMISTIC_PATCH]
            : [MARK_OPTIMISTIC_PATCH],
        ),
      ) as OptimisticRecord<T>[];
    const updatedRecords = new Map(
      pendingUpdates
        .filter((f) => f?.type == 'update')
        .map((u) => [
          u.id,
          applyPatches(
            u.value,
            u.patches.concat([MARK_OPTIMISTIC_PATCH]),
          ) as OptimisticRecord<T>,
        ]),
    );
    const toDelete = new Set(
      pendingUpdates.filter((f) => f?.type == 'delete').map((f) => f.id),
    );
    let res: OptimisticRecord<T>[] = [];
    if (records) {
      for (const plan of records) {
        if (toDelete.has(plan.id)) continue;
        if (updatedRecords.has(plan.id)) {
          res.push(updatedRecords.get(plan.id)!);
        } else {
          res.push(plan as OptimisticRecord<T>);
        }
      }
    }
    res = res.concat(newRecords);
    updateConfig?.postUpdate?.(res);
    return;
  }, [updates]);

  useBlocker({
    shouldBlockFn: () => {
      if (!updates.current) return false;
      const shouldLeave = confirm('Are you sure you want to leave?');
      return !shouldLeave;
    },
    disabled: !updates.current,
  });

  const createHandler = (value: T) => {
    dispatch({ type: 'create', id: value.id, value });
  };

  const updateHandler = (value: T, cb: (v: WritableDraft<T>) => void) => {
    const [, patches] = produceWithPatches(
      value,
      (d) => void cb(d as WritableDraft<T>),
    );
    console.log('update', value, patches);
    if (patches.length > 0)
      dispatch({ type: 'update', id: value.id, value, patches });
  };

  const deleteHandler = (id: string) => {
    dispatch({ type: 'delete', id });
  };

  return {
    records:
      shadowRecords ?? (records as OptimisticRecord<T>[] | undefined) ?? [],
    create: createHandler,
    update: updateHandler,
    delete: deleteHandler,
    isPending: mutation.isPending,
  };
}
