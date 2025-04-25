import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries/db';
import { pbClient } from '@/api/pocketbase';
import { queryClient } from '@/api/queryClient';
import { ArtifactSetsPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { notifyWithRetry } from '@/lib/notify-with-retry';

import { ArtifactSetPicker } from './artifact-set-picker';

type ShortItem = Pick<ArtifactSetsPlans, 'id'>;
type Props = { buildId: string; enabled?: boolean };
export function ArtifactSets({ buildId, enabled }: Props) {
  const queryKey = ['characterPlans', buildId, 'artifactSetsPlans'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<ShortItem>('artifactSetsPlans').getFullList({
        filter: `characterPlan = '${buildId}'`,
        fields: 'id',
      }),
    enabled,
  });
  const { mutate: addSetPlan } = useMutation({
    mutationFn: (artifactSetsId: string) =>
      pbClient.collection<ArtifactSetsPlans>('artifactSetsPlans').create({
        characterPlan: buildId,
        artifactSets: [artifactSetsId],
      }),
    onSuccess(data) {
      queryClient.setQueryData([...queryKey, data.id], data);
      return queryClient.invalidateQueries({ queryKey });
    },
    onError: notifyWithRetry((v) => {
      addSetPlan(v);
    }),
  });

  const artifactSets = query.data;

  if (query.isPending || !artifactSets) {
    return <ArtifactSetsSkeleton />;
  }

  return (
    <ArtifactSetsLoaded
      buildId={buildId}
      queryKey={queryKey}
      artifactSets={artifactSets}
    />
  );
}

type PropsLoaded = Omit<Props, 'enabled'> & {
  artifactSets: ShortItem[];
  queryKey: string[];
};
function ArtifactSetsLoaded({ buildId, queryKey, artifactSets }: PropsLoaded) {
  const { mutate: addSetPlan } = useMutation({
    mutationFn: (artifactSetsId: string) =>
      pbClient.collection<ArtifactSetsPlans>('artifactSetsPlans').create({
        characterPlan: buildId,
        artifactSets: [artifactSetsId],
      }),
    onSuccess(data) {
      queryClient.setQueryData([...queryKey, data.id], data);
      return queryClient.invalidateQueries({ queryKey });
    },
    onError: notifyWithRetry((v) => {
      addSetPlan(v);
    }),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <span className="text-sm">Artifacts</span>
        <ArtifactSetPicker
          title="New artifact set"
          onSelect={(as) => addSetPlan(as)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 disabled:opacity-25"
          >
            <Icons.Add />
          </Button>
        </ArtifactSetPicker>
      </div>
      <div className="grid gap-1 w-full">
        {artifactSets.map((as, i) => (
          <div key={as.id}>
            <ArtifactSet buildId={buildId} artifactSetPlanId={as.id} />
            {artifactSets.length - 1 !== i && (
              <Separator className="bg-muted-foreground rounded-lg mb-1 opacity-50" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type ArtifactSetProps = { buildId: string; artifactSetPlanId: string };
function ArtifactSet({ buildId, artifactSetPlanId }: ArtifactSetProps) {
  const queryKey = [
    'characterPlans',
    buildId,
    'artifactSetsPlans',
    artifactSetPlanId,
  ];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient
        .collection<ArtifactSetsPlans>('artifactSetsPlans')
        .getOne(artifactSetPlanId),
  });
  const {
    mutate: deleteSetPlan,
    isPending: deleteIsPending,
    isSuccess: isDeleted,
  } = useMutation({
    mutationFn: () =>
      pbClient
        .collection<ArtifactSetsPlans>('artifactSetsPlans')
        .delete(artifactSetPlanId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['characterPlans', buildId, 'artifactSetsPlans'],
        exact: true,
      });
      queryClient.removeQueries({ queryKey });
    },
    onError: notifyWithRetry(() => {
      deleteSetPlan();
    }),
  });
  const { mutate: update, variables } = useMutation({
    mutationFn: (v: string[]) =>
      pbClient
        .collection<ArtifactSetsPlans>('artifactSetsPlans')
        .update(artifactSetPlanId, {
          artifactSets: v,
        }),
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKey, data);
    },
    onError: notifyWithRetry((vars) => {
      update(vars);
    }),
  });
  const artifactsSets = useLiveQuery(
    () =>
      db.artifactSets
        .bulkGet(variables ?? query.data?.artifactSets ?? [])
        .then((r) => r.filter((it) => it != undefined)),
    [variables, query.data?.artifactSets],
  );

  const deleteSet = (setId: string) => {
    switch (artifactsSets?.length) {
      case 1:
        return deleteSetPlan();
      case 2:
        update(artifactsSets.filter((it) => it.id != setId).map((it) => it.id));
    }
  };

  const addSet = (setId: string) => {
    switch (artifactsSets?.length) {
      case 1:
        update([...artifactsSets.map((it) => it.id), setId]);
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <div>
      {artifactsSets?.map((artifactSet) => (
        <div key={artifactSet.id} className="flex gap-2 w-full nth-2:mt-1">
          <CollectionAvatar
            record={artifactSet}
            fileName={artifactSet.icon}
            name={artifactSet.name}
            className="size-12"
          />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="flex-1">{artifactSet.name}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
                    disabled={deleteIsPending}
                  >
                    <Icons.Remove />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="top">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => deleteSet(artifactSet.id)}
                    disabled={deleteIsPending}
                  >
                    Yes i really want to delete
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
            <span className="text-xs text-muted-foreground">
              {artifactsSets.length == 2 ? '2 pcs' : '4 pcs'}
            </span>
          </div>
        </div>
      ))}
      <div className="min-h-2 text-center">
        {artifactsSets?.length === 1 && (
          <ArtifactSetPicker
            title="Split into two peaces"
            onSelect={(as) => addSet(as)}
            ignoreArifacts={new Set(artifactsSets.map((it) => it.id))}
          >
            <Button
              variant="ghost"
              size="sm"
              className="opacity-50 transition-opacity focus:opacity-100 hover:opacity-100"
            >
              <Icons.SplitY /> Split into two peaces
            </Button>
          </ArtifactSetPicker>
        )}
      </div>
    </div>
  );
}

export function ArtifactSetsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Skeleton className="h-5 w-15 rounded-md" />
        <Skeleton className="size-5 rounded-md" />
      </div>
      <div className="grid gap-1 w-full">
        <ArtifactSetSkeleton />
      </div>
    </div>
  );
}

function ArtifactSetSkeleton() {
  return (
    <div className="w-full flex gap-2">
      <div className="px-1.5 w-12 h-9">
        <Skeleton className="size-full rounded-4xl" />
      </div>
      <div className="flex-1 grid">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
        <div className="flex items-center justify-between gap-1">
          <Skeleton className="h-4 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
