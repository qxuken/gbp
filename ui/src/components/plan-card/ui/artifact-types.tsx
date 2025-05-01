import { Trigger as SelectTrigger } from '@radix-ui/react-select';
import { useMemo } from 'react';

import { useArtifactTypes, useSpecialsMap } from '@/api/dictionaries/hooks';
import {
  OptimisticArtifactTypePlans,
  useArtifactTypesPlansMutation,
} from '@/api/plans/artifact-types-plans';
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
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';
import { cn } from '@/lib/utils';

type Props = {
  planId: string;
  artfactTypes?: ArtifactTypePlans[];
  disabled?: boolean;
};

export function ArtifactTypes(props: Props) {
  const {
    records,
    create: createRecord,
    delete: deleteRecord,
  } = useArtifactTypesPlansMutation(props.planId, props.artfactTypes);

  const artifactTypes = useArtifactTypes();
  const specialsMap = useSpecialsMap();

  const { groupedByArtifactType, specialsGroupedByArtifactType } = useMemo(
    () =>
      records.reduce(
        (acc, it) => {
          mapGetOrSetDefault(
            acc.groupedByArtifactType,
            it.artifactType,
            () => [],
          ).push(it);
          mapGetOrSetDefault(
            acc.specialsGroupedByArtifactType,
            it.artifactType,
            () => new Set(),
          ).add(it.special);
          return acc;
        },
        {
          groupedByArtifactType: new Map<
            string,
            OptimisticArtifactTypePlans[]
          >(),
          specialsGroupedByArtifactType: new Map<string, Set<string>>(),
        },
      ),
    [records],
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Stats</span>
      <div className="grid gap-2 w-full">
        {artifactTypes?.map((at) => {
          const selected = groupedByArtifactType.get(at.id) ?? [];
          const selectedSpecials = specialsGroupedByArtifactType.get(at.id);
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
                  ['opacity-50']: selected.length === 0 || props.disabled,
                })}
              />
              <div className="flex flex-wrap gap-1 items-center">
                {selected.map((s, i) => {
                  const special = specialsMap.get(s.special);
                  if (!special) {
                    return null;
                  }
                  return (
                    <div key={s.id} className="flex gap-1 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="destructive"
                            className={cn(
                              'text-md leading-none py-0 px-2 not-hover:bg-transparent not-focus:bg-transparent',
                              {
                                'opacity-75 animate-pulse': s.optimistic,
                              },
                            )}
                            disabled={props.disabled}
                          >
                            {special.name}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" side="top">
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => deleteRecord(s.id)}
                            disabled={s.optimistic || props.disabled}
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
                  <Select
                    onValueChange={(special) =>
                      createRecord({ artifactType: at.id, special })
                    }
                    value=""
                    disabled={props.disabled}
                  >
                    <SelectTrigger data-slot="select-trigger" asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 opacity-50 hover:opacity-100 focus:opacity-100"
                        disabled={props.disabled}
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
