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
import { ClientResponseError } from 'pocketbase';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useImmerReducer } from 'use-immer';

import { pbClient } from '@/api/pocketbase';
import { removeByPredMut } from '@/lib/array-remove-mut';
import { delay } from '@/lib/delay';
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { logger } from '@/store/logger';

import { queryClient } from '../../queryClient';
import { Plans, PlansExtra } from '../../types';
import { PLANS_QUERY } from '../plans';

const DEFAULT_DEBOUNCE_MS = 450;

const CREATE_RECORD_PATCH: Patch[] = [
  { op: 'remove', path: ['id'] },
  { op: 'remove', path: ['created'] },
  { op: 'remove', path: ['updated'] },
];

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

const ERROR_OPTIMISTIC_PATCH: Patch = {
  op: 'add',
  path: ['isOptimisticError'],
  value: true,
};

export type OptimisticRecord<T> = T & {
  isOptimistic?: boolean;
  isOptimisticBlocked?: boolean;
  isOptimisticError?: boolean;
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

interface PrepareBatchAction {
  type: 'prepareBatch';
}
interface SetCurrentBatchStateAction {
  type: 'setCurrentBatchState';
  value: 'done' | 'error' | 'pending' | 'scheduled';
}
type MutationReducerActions<T> =
  | MutationAction<T>
  | SetCurrentBatchStateAction
  | PrepareBatchAction;

interface ToUpdateRecord<T> {
  value: T;
  patches: Patch[];
}
interface CurrentMutationBatch<T> {
  toCreate: Map<string, T>;
  toUpdate: Map<string, ToUpdateRecord<T>>;
  toDelete: Set<string>;
  state: 'scheduled' | 'pending' | 'error';
}
interface MutationReducerState<T> {
  meta: { collectionName: string };
  toCreate: Map<string, T>;
  toUpdate: Map<string, ToUpdateRecord<T>>;
  toDelete: Set<string>;
  currentBatch: CurrentMutationBatch<T> | null;
}

function updatesReducer<T>(
  state: WritableDraft<MutationReducerState<T>>,
  action: MutationReducerActions<T>,
) {
  switch (action.type) {
    case 'create': {
      state.toCreate.set(action.id, castDraft(action.value));
      break;
    }
    case 'update': {
      if (state.currentBatch?.toCreate.has(action.id)) break;
      if (
        state.toDelete.has(action.id) ||
        state.currentBatch?.toDelete.has(action.id)
      )
        break;
      if (state.toCreate.has(action.id)) {
        const current = state.toCreate.get(action.id);
        state.toCreate.set(action.id, applyPatches(current!, action.patches));
        break;
      }
      const entry = mapGetOrSetDefault(state.toUpdate, action.id, () => ({
        value: castDraft(action.value),
        patches: [],
      }));
      entry.patches.push(...action.patches);
      break;
    }
    case 'delete': {
      if (
        state.currentBatch?.toCreate.has(action.id) ||
        state.currentBatch?.toDelete.has(action.id)
      )
        break;
      if (state.toCreate.has(action.id)) {
        state.toCreate.delete(action.id);
        break;
      }
      if (state.toUpdate.has(action.id)) {
        state.toUpdate.delete(action.id);
      }
      state.toDelete.add(action.id);
      break;
    }
    case 'prepareBatch': {
      if (state.currentBatch) break;
      state.currentBatch = {
        toCreate: state.toCreate,
        toUpdate: state.toUpdate,
        toDelete: state.toDelete,
        state: 'pending',
      };
      state.toCreate = new Map();
      state.toUpdate = new Map();
      state.toDelete = new Set();
      break;
    }
    case 'setCurrentBatchState':
      switch (action.value) {
        case 'done': {
          state.currentBatch = null;
          break;
        }
        case 'pending':
          if (state.currentBatch) {
            if (state.currentBatch.state == 'error') {
              state.currentBatch.state = 'pending';

              state.currentBatch.toCreate = new Map([
                ...state.toCreate,
                ...state.currentBatch.toCreate,
              ]);

              for (const [id, update] of state.toUpdate) {
                const entry = mapGetOrSetDefault(
                  state.currentBatch.toUpdate,
                  id,
                  () => ({
                    value: update.value,
                    patches: [],
                  }),
                );
                entry.patches.push(...update.patches);
              }

              state.currentBatch.toDelete = new Set([
                ...state.toDelete,
                ...state.currentBatch.toDelete,
              ]);
              for (const id of state.currentBatch.toDelete) {
                state.currentBatch.toUpdate.delete(id);
                state.currentBatch.toCreate.delete(id);
              }
              state.toCreate = new Map();
              state.toUpdate = new Map();
              state.toDelete = new Set();
            }
          } else {
            logger.error(
              `(${state.meta.collectionName}) requested to change currentBatch state to 'pending', but currentBatch is gone`,
            );
          }
          break;
        case 'error':
          if (state.currentBatch) {
            if (state.currentBatch.state == 'scheduled')
              state.currentBatch.state = 'error';
          } else {
            logger.error(
              `(${state.meta.collectionName}) requested to change currentBatch state to 'error', but currentBatch is gone`,
            );
          }
          break;
        case 'scheduled': {
          if (state.currentBatch) {
            if (state.currentBatch.state == 'pending')
              state.currentBatch.state = 'scheduled';
          } else {
            logger.error(
              `(${state.meta.collectionName}) requested to change currentBatch state to 'scheduled', but currentBatch is gone`,
            );
          }
        }
      }
      break;
  }
}

export function useCollectionMutation<T extends { id: string }>(
  collectionName: string,
  getCollectionToUpdate: (plans: Plans[]) => T[] | undefined,
  records?: T[],
  disabled?: boolean,
  mutationKey?: MutationKey,
  updateConfig?: {
    debounceMS?: number;
    postUpdate?: (v: T[]) => void;
    serverPatches?: Patch[];
    onErrorChange?: (val: boolean) => void;
    onPendingChange?: (val: boolean) => void;
  },
) {
  const [updates, dispatch] = useImmerReducer<
    MutationReducerState<T>,
    MutationReducerActions<T>,
    string
  >(updatesReducer, collectionName, (collectionName) => ({
    meta: { collectionName },
    toCreate: new Map(),
    toDelete: new Set(),
    toUpdate: new Map(),
    currentBatch: null,
  }));

  const lastReportedPendingState = useRef(false);
  const lastReportedErrorState = useRef(false);

  const isPending = Boolean(
    updates.currentBatch && updates.currentBatch.state != 'error',
  );
  const isError = updates.currentBatch?.state == 'error';

  const hasUpdates = useMemo(
    () =>
      updates.currentBatch ||
      updates.toUpdate.size > 0 ||
      updates.toCreate.size > 0 ||
      updates.toDelete.size > 0,
    [updates],
  );

  useEffect(() => {
    if (updates.currentBatch) return;
    if (!hasUpdates) return;

    const t = setTimeout(() => {
      dispatch({ type: 'prepareBatch' });
    }, updateConfig?.debounceMS ?? DEFAULT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [updates.currentBatch, hasUpdates]);

  useEffect(() => {
    if (updates.currentBatch?.state == 'pending' && !disabled) {
      mutation.mutateAsync(updates.currentBatch);
    }
    if (
      updateConfig?.onPendingChange &&
      lastReportedPendingState.current != isPending
    ) {
      updateConfig?.onPendingChange?.(isPending);
      lastReportedPendingState.current = isPending;
    }
    if (
      updateConfig?.onErrorChange &&
      lastReportedErrorState.current != isError
    ) {
      updateConfig?.onErrorChange?.(isError);
      lastReportedErrorState.current = isError;
    }
  }, [updates.currentBatch?.state, disabled]);

  const retryHandler = () => {
    if (!updates.currentBatch) return;
    logger.debug('retry', collectionName);
    dispatch({ type: 'setCurrentBatchState', value: 'pending' });
  };

  const createHandler = (value: T) => {
    logger.debug('create', collectionName, value);
    dispatch({ type: 'create', id: value.id, value });
    retryHandler();
  };

  const updateHandler = (value: T, cb: (v: WritableDraft<T>) => void) => {
    const [, patches] = produceWithPatches(
      value,
      (d) => void cb(d as WritableDraft<T>),
    );
    logger.debug('update', collectionName, value, patches);
    if (patches.length > 0) {
      dispatch({ type: 'update', id: value.id, value, patches });
      retryHandler();
    }
  };

  const deleteHandler = (id: string) => {
    logger.debug('delete', collectionName, id);
    dispatch({ type: 'delete', id });
    retryHandler();
  };

  const mutation = useMutation({
    mutationKey,
    mutationFn(batchData: CurrentMutationBatch<T>) {
      const batch = pbClient.createBatch();
      for (const [id, item] of batchData.toUpdate) {
        const value = applyPatches(
          item.value,
          item.patches.concat(updateConfig?.serverPatches ?? []),
        );
        logger.debug('toUpdate', id, item, value);
        batch.collection(collectionName).update(id, value);
      }
      for (const [id, item] of batchData.toCreate) {
        const value = applyPatches(
          item,
          CREATE_RECORD_PATCH.concat(updateConfig?.serverPatches ?? []),
        );
        logger.debug('toCreate', id, item, value);
        batch.collection(collectionName).create(value);
      }
      for (const id of batchData.toDelete) {
        logger.debug('toDelete', id);
        batch.collection(collectionName).delete(id);
      }
      return batch.send();
    },
    onMutate() {
      dispatch({ type: 'setCurrentBatchState', value: 'scheduled' });
    },
    async onSuccess(data, batch) {
      queryClient.setQueryData(
        PLANS_QUERY.queryKey,
        (plans: Plans[] | undefined) => {
          if (!plans) {
            logger.error(`${collectionName} got empty plans array on success`);
            return;
          }
          return produce(plans, (plans) => {
            const collection = getCollectionToUpdate(plans);
            if (!collection) {
              logger.error(`${collectionName} getter return undefined`);
              return;
            }
            let index = 0;
            for (const [id] of batch.toUpdate) {
              const res = data[index++].body;
              const itemIndex = collection.findIndex((p) => p.id == res.id);
              if (itemIndex < 0) {
                logger.error(
                  `(${collectionName})[${id}] could not item find it's intended to update`,
                );
                return;
              }
              collection[itemIndex] = {
                ...collection[itemIndex],
                ...res,
              };
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _ of batch.toCreate) {
              const res = data[index++].body;
              collection.push(res);
            }
            for (const id of batch.toDelete) {
              removeByPredMut(collection, (it) => it.id == id);
            }
            updateConfig?.postUpdate?.(collection);
          });
        },
      );
      dispatch({ type: 'setCurrentBatchState', value: 'done' });
    },
    onError(err) {
      if (err instanceof ClientResponseError && err.isAbort) {
        return;
      }
      const error =
        err instanceof ClientResponseError && err.data?.data?.requests?.[0]
          ? new ClientResponseError(err.data?.data?.requests?.[0])
          : new Error();
      logger.error(error);
      dispatch({ type: 'setCurrentBatchState', value: 'error' });
      notifyWithRetry(retryHandler)(error);
    },
  });

  const shadowRecords = useMemo(() => {
    if (!hasUpdates) {
      return null;
    }

    const optimisticPatches = [MARK_OPTIMISTIC_PATCH];
    if (updates.currentBatch?.state == 'error') {
      optimisticPatches.push(ERROR_OPTIMISTIC_PATCH);
    }
    const blockedOptimisticPatches = optimisticPatches.concat([
      BLOCK_OPTIMISTIC_PATCH,
    ]);

    const newRecords = Array.from(updates.toCreate.values(), (value) =>
      applyPatches(value, optimisticPatches),
    ).concat(
      Array.from(updates.currentBatch?.toCreate.values() ?? [], (value) =>
        applyPatches(value, blockedOptimisticPatches),
      ),
    ) as OptimisticRecord<T>[];

    const updatedRecords = new Map(
      Array.from(updates.currentBatch?.toUpdate.entries() ?? [], ([id, u]) => [
        id,
        applyPatches(
          u.value,
          u.patches.concat(optimisticPatches),
        ) as OptimisticRecord<T>,
      ]),
    );
    for (const [id, u] of updates.toUpdate) {
      if (updatedRecords.has(id)) {
        updatedRecords.set(
          id,
          applyPatches(
            updatedRecords.get(id)!,
            u.patches,
          ) as OptimisticRecord<T>,
        );
      } else {
        updatedRecords.set(
          id,
          applyPatches(
            u.value,
            u.patches.concat([MARK_OPTIMISTIC_PATCH]),
          ) as OptimisticRecord<T>,
        );
      }
    }
    const toDelete = new Set([
      ...updates.toDelete,
      ...(updates.currentBatch?.toDelete ?? []),
    ]);
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
    return res;
  }, [hasUpdates, updates, updateConfig?.postUpdate]);

  useBlocker({
    shouldBlockFn: () => {
      if (!updates.currentBatch) return false;
      const shouldLeave = confirm('Are you sure you want to leave?');
      return !shouldLeave;
    },
    disabled: !updates.currentBatch,
  });

  return {
    records:
      shadowRecords ?? (records as OptimisticRecord<T>[] | undefined) ?? [],
    create: createHandler,
    update: updateHandler,
    delete: deleteHandler,
    retry: retryHandler,
    isPending,
    isError,
  };
}

export function usePlanCollectionAccessor<
  Key extends keyof PlansExtra,
  T extends PlansExtra[Key] extends (infer T)[] | undefined
    ? T
    : { id: string },
>(collectionName: Key, planId: string) {
  return useCallback(
    (plans: Plans[]): T[] | undefined => {
      const plan = plans.find((p) => p.id == planId);
      if (!plan) {
        logger.error(
          `${collectionName} could not find plan(${planId}) it's intended to update`,
        );
        return;
      }
      plan[collectionName] ??= [];
      // @ts-expect-error Too much for ts (or me) to handle
      return plan[collectionName];
    },
    [collectionName, planId],
  );
}
