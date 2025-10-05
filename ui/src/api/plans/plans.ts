import { queryOptions, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { pbClient } from '@/api/pocketbase';
import { Plans } from '@/api/types';
import { createRecordsMap } from '@/lib/create-records-map';
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';
import { logger } from '@/store/logger';

export const PLANS_QUERY = queryOptions({
  queryKey: ['plans'],
  async queryFn({ signal,...conf }) {
    logger.trace('query:plans->start', conf);
    const res = await pbClient
      .collection<Plans>('plans')
      .getFullList({ signal });
    logger.debug('query:plans->success');
    return res.map(
      (plan): Plans => ({
        ...plan,
        created: new Date(plan.created),
        updated: new Date(plan.updated),
        artifactSetsPlans: plan.artifactSetsPlans?.map((asp) => ({
          ...asp,
          artifactSets: JSON.parse(asp.artifactSets as unknown as string),
          created: new Date(asp.created),
          updated: new Date(asp.updated),
        })),
        artifactTypePlans: plan.artifactTypePlans?.map((atp) => ({
          ...atp,
          created: new Date(atp.created),
          updated: new Date(atp.updated),
        })),
        weaponPlans: plan.weaponPlans?.map((wp) => ({
          ...wp,
          created: new Date(wp.created),
          updated: new Date(wp.updated),
        })),
        teamPlans: plan.teamPlans?.map((tp) => ({
          ...tp,
          characters: JSON.parse(tp.characters as unknown as string),
          created: new Date(tp.created),
          updated: new Date(tp.updated),
        })),
      }),
    );
  },
});

export function usePlans() {
  const query = useQuery(PLANS_QUERY);
  return query.data ?? [];
}

export function usePlansMap() {
  const plans = usePlans();
  return useMemo(() => createRecordsMap(plans), [plans]);
}

export function usePlansIsLoading() {
  const query = useQuery(PLANS_QUERY);
  return query.isLoading;
}

interface PendingStatusEntry {
  pendings: Set<string>;
  errors: Set<string>;
}
interface SharedPendingStatus {
  state: Map<string, PendingStatusEntry>;
  setPending(planId: string, entity: string): void;
  deletePending(planId: string, entity: string): void;
  setError(planId: string, entity: string): void;
  deleteError(planId: string, entity: string): void;
}

function newPendingStatusEntry(): PendingStatusEntry {
  return { pendings: new Set(), errors: new Set() };
}

const useSharedPendingPlansStatus = create<SharedPendingStatus>()(
  immer((set) => ({
    state: new Map(),
    setPending(planId, entity) {
      set((state) => {
        mapGetOrSetDefault(
          state.state,
          planId,
          newPendingStatusEntry,
        ).pendings.add(entity);
      });
    },
    deletePending(planId, entity) {
      set((state) => {
        const entry = state.state.get(planId);
        if (!entry) return;
        entry.pendings.delete(entity);
        if (entry.pendings.size == 0 && entry.errors.size == 0) {
          state.state.delete(planId);
        }
      });
    },
    setError(planId, entity) {
      set((state) => {
        mapGetOrSetDefault(
          state.state,
          planId,
          newPendingStatusEntry,
        ).errors.add(entity);
      });
    },
    deleteError(planId, entity) {
      set((state) => {
        const entry = state.state.get(planId);
        if (!entry) return;
        entry.errors.delete(entity);
        if (entry.pendings.size == 0 && entry.errors.size == 0) {
          state.state.delete(planId);
        }
      });
    },
  })),
);

export function useSharedPendingPlansStatusEntry(planId: string) {
  const entry = useSharedPendingPlansStatus((state) => state.state.get(planId));
  const isPending = (entry?.pendings.size ?? 0) > 0;
  const isError = (entry?.errors.size ?? 0) > 0;

  return [isPending, isError] as const;
}

export function useSharedPendingPlansCollectionReporter(
  collectionName: string,
  planId: string,
) {
  const setPending = useSharedPendingPlansStatus((state) => state.setPending);
  const deletePending = useSharedPendingPlansStatus(
    (state) => state.deletePending,
  );
  const setError = useSharedPendingPlansStatus((state) => state.setError);
  const deleteError = useSharedPendingPlansStatus((state) => state.deleteError);

  const onPendingChange = useCallback(
    (state: boolean) => {
      if (state) {
        setPending(planId, collectionName);
      } else {
        deletePending(planId, collectionName);
      }
    },
    [setPending, deletePending],
  );

  const onErrorChange = useCallback(
    (state: boolean) => {
      if (state) {
        setError(planId, collectionName);
      } else {
        deleteError(planId, collectionName);
      }
    },
    [setError, deleteError],
  );

  useEffect(
    () => () => {
      deletePending(planId, collectionName);
      deleteError(planId, collectionName);
    },
    [],
  );

  return [onPendingChange, onErrorChange] as const;
}
