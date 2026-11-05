import type { MutationKey } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import type { Patch, WritableDraft } from 'immer';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import type { Plans, PlansExtra } from '@/api/types';
import { logger } from '@/store/logger';

import type { MutationTarget } from './collection-mutation-coordinator';
import { plansMutationCoordinator } from './plans-mutation-coordinator';

export type { OptimisticRecord } from './collection-mutation-coordinator';

export function useCollectionMutation<T extends { id: string }>(
  collectionName: string,
  getCollectionToUpdate: (plans: Plans[]) => T[] | undefined,
  records?: T[],
  disabled?: boolean,
  mutationKey?: MutationKey,
  updateConfig?: {
    postUpdate?: (v: T[]) => void;
    serverPatches?: Patch[];
    onErrorChange?: (val: boolean) => void;
    onPendingChange?: (val: boolean) => void;
  },
) {
  const scope = JSON.stringify(mutationKey ?? [collectionName]);
  const getSnapshot = useCallback(
    () => plansMutationCoordinator.getSnapshot(scope),
    [scope],
  );
  const version = useSyncExternalStore(
    plansMutationCoordinator.subscribe,
    getSnapshot,
    getSnapshot,
  );
  const { hasChanges, isPending, isError } =
    plansMutationCoordinator.getStatus(scope);
  const postUpdate = updateConfig?.postUpdate;
  const shadowRecords = useMemo(() => {
    const result = plansMutationCoordinator.getRecords(
      scope,
      collectionName,
      records,
    );
    postUpdate?.(result);
    return result;
  }, [version, scope, collectionName, records, postUpdate]);

  useEffect(() => {
    plansMutationCoordinator.setDisabled(scope, Boolean(disabled));
  }, [scope, disabled]);

  const onPendingChange = updateConfig?.onPendingChange;
  const onErrorChange = updateConfig?.onErrorChange;
  useEffect(() => {
    onPendingChange?.(isPending);
    return () => onPendingChange?.(false);
  }, [onPendingChange, isPending]);
  useEffect(() => {
    onErrorChange?.(isError);
    return () => onErrorChange?.(false);
  }, [onErrorChange, isError]);

  const target: MutationTarget<T> = {
    scope,
    collectionName,
    getCollectionToUpdate,
    serverPatches: updateConfig?.serverPatches,
    postUpdate,
  };

  useBlocker({
    shouldBlockFn: () =>
      hasChanges && !confirm('Are you sure you want to leave?'),
    disabled: !hasChanges,
  });

  return {
    records: shadowRecords,
    create(value: T) {
      plansMutationCoordinator.create(target, value);
    },
    update(value: T, cb: (v: WritableDraft<T>) => void) {
      plansMutationCoordinator.update(target, value, cb);
    },
    delete(id: string) {
      plansMutationCoordinator.delete(target, id);
    },
    retry: plansMutationCoordinator.retry,
    isPending,
    isError,
  };
}

export function usePlanCollectionAccessor<
  Key extends keyof PlansExtra,
  T extends (PlansExtra[Key] extends (infer T)[] | undefined
    ? T
    : { id: string }),
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
