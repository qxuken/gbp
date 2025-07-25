import { Trigger as SelectTrigger } from '@radix-ui/react-select';
import { useMemo } from 'react';

import { useArtifactTypes, useSpecialsItem } from '@/api/dictionaries/hooks';
import {
  OptimisticArtifactTypePlans,
  useArtifactTypesPlansMutation,
} from '@/api/plans/artifact-types-plans';
import {
  ArtifactTypePlans,
  ArtifactTypes as TArtifactTypes,
} from '@/api/types';
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
import {
  UiPlansMode,
  useUiPlansConfigModeValue,
} from '@/store/ui-plans-config';

type Props = {
  planId: string;
  artfactTypesPlans?: ArtifactTypePlans[];
  disabled?: boolean;
};
export function ArtifactTypes(props: Props) {
  const mutation = useArtifactTypesPlansMutation(
    props.planId,
    props.artfactTypesPlans,
    props.disabled,
  );
  const artifactTypes = useArtifactTypes();

  const { groupedByArtifactType, specialsGroupedByArtifactType } = useMemo(
    () =>
      mutation.records.reduce(
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
    [mutation.records],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <span
          className={cn('text-xs text-muted-foreground', {
            'text-rose-700': mutation.isError,
          })}
        >
          Stats
        </span>
        <div className="flex-1" />
        {mutation.isError && (
          <Button
            variant="ghost"
            className="h-6 opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 disabled:opacity-25"
            onClick={mutation.retry}
            disabled={props.disabled}
          >
            <Icons.Retry className="text-rose-700" />
            Retry
          </Button>
        )}
      </div>
      <div className="grid gap-2 w-full">
        {artifactTypes.map((at) => {
          return (
            <ArtifactTypesItem
              key={at.id}
              artifactTypesItem={at}
              selected={groupedByArtifactType.get(at.id)}
              selectedSpecials={specialsGroupedByArtifactType.get(at.id)}
              create={(special) =>
                mutation.create({
                  artifactType: at.id,
                  special,
                })
              }
              delete={mutation.delete}
              disabled={props.disabled}
            />
          );
        })}
      </div>
    </div>
  );
}

type ArtifactTypesItemProps = {
  artifactTypesItem: TArtifactTypes;
  selected?: OptimisticArtifactTypePlans[];
  selectedSpecials?: Set<string>;
  create: (specialId: string) => void;
  delete: (id: string) => void;
  disabled?: boolean;
};
export function ArtifactTypesItem(props: ArtifactTypesItemProps) {
  const mode = useUiPlansConfigModeValue();
  const options = useMemo(
    () =>
      props.artifactTypesItem.specials.filter(
        (s) => !props.selectedSpecials || !props.selectedSpecials.has(s),
      ),
    [props.artifactTypesItem, props.selectedSpecials],
  );

  return (
    <div className="w-full flex gap-2">
      <CollectionAvatar
        record={props.artifactTypesItem}
        fileName={props.artifactTypesItem.icon}
        name={props.artifactTypesItem.name}
        className={cn({
          'opacity-50': props.selected?.length === 0 || props.disabled,
          'size-8': mode == UiPlansMode.Full,
          'size-6': mode == UiPlansMode.Short,
        })}
      />
      <div className="flex flex-wrap gap-1 items-center">
        {props.selected?.map((s, i) => (
          <ArtifactTypesSpecialItem
            key={s.id}
            special={s.special}
            delete={() => props.delete(s.id)}
            isLoading={s.isOptimistic}
            isLast={props.selected && props.selected.length - 1 == i}
            disabled={s.isOptimisticBlocked || props.disabled}
          />
        ))}
        {options.length > 0 && (
          <Select
            onValueChange={(special) => props.create(special)}
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
                <ArtifactTypesItemSelectOption key={special} value={special} />
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

type ArtifactTypesItemSelectOptionProps = {
  value: string;
};
export function ArtifactTypesItemSelectOption(
  props: ArtifactTypesItemSelectOptionProps,
) {
  const special = useSpecialsItem(props.value);

  if (!special) {
    return null;
  }
  return (
    <SelectItem key={props.value} value={props.value}>
      {special.name}
    </SelectItem>
  );
}

type ArtifactTypesSpecialItemProps = {
  special: string;
  delete: () => void;
  isLast?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
};
export function ArtifactTypesSpecialItem(props: ArtifactTypesSpecialItemProps) {
  const special = useSpecialsItem(props.special);
  const mode = useUiPlansConfigModeValue();

  if (!special) {
    return null;
  }
  return (
    <div className="flex gap-1 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size={mode == UiPlansMode.Short ? 'sm' : 'default'}
            variant="destructive"
            className={cn(
              'leading-none not-hover:text-primary not-hover:bg-transparent',
              {
                'opacity-75 animate-pulse': props.isLoading,
                'text-md py-0 px-2': mode == UiPlansMode.Full,
                'text-xs py-0 px-2 h-6': mode == UiPlansMode.Short,
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
            onClick={props.delete}
            disabled={props.disabled}
          >
            Yes, I really want to delete
          </Button>
        </PopoverContent>
      </Popover>
      {!props.isLast && <Icons.Divide className="text-gray-400 size-4" />}
    </div>
  );
}
