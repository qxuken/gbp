import { Trigger as SelectTrigger } from '@radix-ui/react-select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { ArtifactSetsPlans, OnlyId } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { cn } from '@/lib/utils';
import { queryClient } from '@/main';

import { ArtifactSetPicker } from './artifact-set-picker';

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
  const artifactsSets = useLiveQuery(
    () =>
      db.artifactSets
        .bulkGet(query.data?.artifactSets ?? [])
        .then((r) => r.filter((it) => it != undefined)),
    [query.data?.artifactSets],
  );
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

  if (isDeleted) {
    return null;
  }

  return artifactsSets?.map((artifactSet) => (
    <div key={artifactSet.id} className="flex gap-2 w-full group/artifact-set">
      <CollectionAvatar
        record={artifactSet}
        fileName={artifactSet.icon}
        name={artifactSet.name}
        size={48}
        className="size-12"
      />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="flex-1">{artifactSet.name}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 p-1 opacity-75 invisible group-hover/artifact-set:visible group-focus-within/artifact-set:visible focus:visible hover:outline disabled:visible data-[state=open]:visible data-[state=open]:outline data-[state=open]:animate-pulse"
                disabled={deleteIsPending}
              >
                <Icons.remove />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="top">
              <Button
                variant="destructive"
                className="w-full"
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
  ));
}

type Props = { buildId: string };
export function ArtifactSets({ buildId }: Props) {
  const queryKey = ['characterPlans', buildId, 'artifactSetsPlans'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<OnlyId>('artifactSetsPlans').getFullList({
        filter: `characterPlan = '${buildId}'`,
        fields: 'id',
      }),
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
  return (
    <div className="flex flex-col gap-2 group/artifact-sets">
      <div className="flex items-center gap-1">
        <span className="text-sm">Artifacts</span>
        <ArtifactSetPicker
          title="New artifact set"
          onSelect={(as) => addSetPlan(as)}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-6 opacity-75 transition-opacity invisible group-hover/artifact-sets:visible group-focus-within/artifact-sets:visible focus:opacity-100 hover:opacity-100',
              {
                ['visible opacity-50']: artifactSets?.length === 0,
              },
            )}
          >
            <Icons.add />
          </Button>
        </ArtifactSetPicker>
      </div>
      <div className="grid gap-1 w-full">
        {artifactSets?.map((as) => (
          <ArtifactSet
            key={as.id}
            buildId={buildId}
            artifactSetPlanId={as.id}
          />
        ))}
      </div>
    </div>
  );
}
