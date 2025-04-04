import { Trigger as SelectTrigger } from '@radix-ui/react-select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { ArtifactTypePlans, Specials } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { cn } from '@/lib/utils';
import { queryClient } from '@/main';

type Props = { buildId: string; enabled?: boolean };
export function ArtifactStats({ buildId, enabled }: Props) {
  const queryKey = ['characterPlans', buildId, 'artifactTypePlans'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<ArtifactTypePlans>('artifactTypePlans').getFullList({
        filter: `characterPlan = '${buildId}'`,
      }),
    enabled,
  });

  const items = query.data;

  if (query.isPending || !items) {
    return <ArtifactStatsSkeleton />;
  }

  return (
    <ArtifactStatsLoaded buildId={buildId} items={items} queryKey={queryKey} />
  );
}

type AddArtifactType = { type: 'add' } & Pick<
  ArtifactTypePlans,
  'special' | 'artifactType'
>;
type DeleteArtifactType = { type: 'delete' } & Pick<ArtifactTypePlans, 'id'>;
type PropsLoaded = Omit<Props, 'enabled'> & {
  items: ArtifactTypePlans[];
  queryKey: string[];
};
function ArtifactStatsLoaded({ buildId, items, queryKey }: PropsLoaded) {
  const { mutate } = useMutation({
    mutationFn: async (variables: AddArtifactType | DeleteArtifactType) => {
      switch (variables.type) {
        case 'add':
          await pbClient
            .collection<ArtifactTypePlans>('artifactTypePlans')
            .create({
              characterPlan: buildId,
              special: variables.special,
              artifactType: variables.artifactType,
            });
          return;
        case 'delete':
          await pbClient
            .collection<ArtifactTypePlans>('artifactTypePlans')
            .delete(variables.id);
          return;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: notifyWithRetry((v) => {
      mutate(v);
    }),
  });

  const artifactTypes = useLiveQuery(
    () => db.artifactTypes.orderBy('order').toArray(),
    [],
  );
  const specialsMap = useLiveQuery(
    () =>
      db.specials.toArray().then((s) =>
        s.reduce((acc, it) => {
          acc.set(it.id, it);
          return acc;
        }, new Map<string, Specials>()),
      ),
    [],
  );

  const artifactTypesPlans = items.reduce((acc, it) => {
    let types = acc.get(it.artifactType);
    if (!types) {
      types = new Set();
      acc.set(it.artifactType, types);
    }
    types.add(it.special);
    return acc;
  }, new Map<string, Set<string>>());

  const addSpecial = (artifactType: string, special: string) => {
    mutate({ special, artifactType, type: 'add' });
  };

  const deleteSpecial = (artifactType: string, special: string) => {
    const id = items.find(
      (at) => at.special === special && at.artifactType === artifactType,
    )?.id;
    if (!id) {
      return;
    }
    mutate({ id, type: 'delete' });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Stats</span>
      <div className="grid gap-2 w-full">
        {artifactTypes?.map((at) => {
          const selectedSpecials = artifactTypesPlans?.get(at.id);
          const selected = Array.from(selectedSpecials?.values() ?? []);
          const options = at.specials
            .map((s) => specialsMap?.get(s))
            .filter(
              (s) => s && (!selectedSpecials || !selectedSpecials.has(s.id)),
            ) as Specials[];
          return (
            <div key={at.id} className="w-full flex gap-2">
              <CollectionAvatar
                record={at}
                fileName={at.icon}
                name={at.name}
                className={cn('size-8', {
                  ['opacity-50']: selected.length === 0,
                })}
              />
              <div className="flex flex-wrap gap-1 items-start">
                {selected.map((s, i) => {
                  const special = specialsMap?.get(s);
                  if (!special) {
                    return null;
                  }
                  return (
                    <div key={special.id} className="flex gap-1 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-md after:text-gray-400 cursor-pointer hover:line-through focus:line-through">
                            {special.name}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" side="top">
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => deleteSpecial(at.id, s)}
                          >
                            Yes i really want to delete
                          </Button>
                        </PopoverContent>
                      </Popover>
                      {selected.length - 1 !== i && (
                        <Icons.Divide className="text-gray-400 size-4" />
                      )}
                    </div>
                  );
                })}
                {options.length > 0 && (
                  <Select onValueChange={(s) => addSpecial(at.id, s)} value="">
                    <SelectTrigger data-slot="select-trigger" asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 opacity-50 hover:opacity-100 focus:opacity-100"
                      >
                        <Icons.Add />
                      </Button>
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((special) => (
                        <SelectItem key={special.id} value={special.id}>
                          {special.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ArtifactStatsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-9 rounded-md" />
      <div className="grid gap-2 w-full">
        <ArtifactStatSkeleton />
        <ArtifactStatSkeleton />
        <ArtifactStatSkeleton />
      </div>
    </div>
  );
}

function ArtifactStatSkeleton() {
  return (
    <div className="w-full flex gap-2">
      <div className="px-1.5 w-12 h-9">
        <Skeleton className="size-full rounded-4xl" />
      </div>
      <div className="flex flex-wrap gap-2 items-start">
        <Skeleton className="h-4 w-10 rounded-md" />
        <Skeleton className="size-4 rounded-md" />
      </div>
    </div>
  );
}
