import { Trigger as SelectTrigger } from '@radix-ui/react-select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { ArtifactTypePlans, Specials } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { cn } from '@/lib/utils';
import { queryClient } from '@/main';

type Props = { buildId: string };
export function ArtifactTypes({ buildId }: Props) {
  const queryKey = ['characterPlans', buildId, 'artifactTypePlans'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<ArtifactTypePlans>('artifactTypePlans').getFullList({
        filter: `characterPlan = '${buildId}'`,
      }),
  });

  const { mutate } = useMutation({
    mutationFn: async (
      variables:
        | ({ type: 'add' } & Pick<
            ArtifactTypePlans,
            'special' | 'artifactType'
          >)
        | ({ type: 'delete' } & Pick<ArtifactTypePlans, 'id'>),
    ) => {
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

  const artifactTypes = useLiveQuery(() => db.artifactTypes.toArray(), []);
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

  const artifactTypesPlans = query.data?.reduce((acc, it) => {
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
    const id = query.data?.find(
      (at) => at.special === special && at.artifactType === artifactType,
    )?.id;
    if (!id) {
      return;
    }
    mutate({ id, type: 'delete' });
  };

  return (
    <div className="flex flex-col gap-2">
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
            <div key={at.id} className="group/at w-full flex gap-2">
              <CollectionAvatar
                record={at}
                fileName={at.icon}
                name={at.name}
                size={32}
                className={cn('size-12', {
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
                    <Popover key={special.id}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            'text-md after:text-gray-400 cursor-pointer hover:line-through focus:line-through',
                            {
                              ['after:content-[","]']:
                                selected.length - 1 !== i,
                            },
                          )}
                        >
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
                  );
                })}
                {options.length > 0 && (
                  <Select onValueChange={(s) => addSpecial(at.id, s)} value="">
                    <SelectTrigger data-slot="select-trigger" asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          'size-6 opacity-75 invisible group-hover/at:visible group-focus-within/at:visible data-[state=open]:visible hover:opacity-100 focus:opacity-100',
                          {
                            ['visible opacity-50']: selected.length === 0,
                          },
                        )}
                      >
                        <Icons.add />
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
