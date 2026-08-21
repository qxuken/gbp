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

import { RemovableChip, SectionHeader } from './section';

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
    <div className="flex flex-col gap-1.5">
      <SectionHeader
        icon={Icons.MainStat}
        title="Main stats"
        isError={mutation.isError}
        retry={mutation.retry}
        disabled={props.disabled}
      />
      <div className="grid w-full gap-2 @[26rem]/plan:grid-cols-3">
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
  const options = useMemo(
    () =>
      props.artifactTypesItem.specials.filter(
        (s) => !props.selectedSpecials || !props.selectedSpecials.has(s),
      ),
    [props.artifactTypesItem, props.selectedSpecials],
  );
  const isEmpty = !props.selected || props.selected.length === 0;

  return (
    <div
      className={cn(
        'flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 transition-colors @[26rem]/plan:h-full @[26rem]/plan:flex-col @[26rem]/plan:gap-1.5',
        isEmpty
          ? 'border-dashed border-border/60 bg-transparent'
          : 'border-border/70 bg-muted/35',
      )}
    >
      <div className="flex shrink-0 items-center gap-1.5">
        <CollectionAvatar
          record={props.artifactTypesItem}
          fileName={props.artifactTypesItem.icon}
          name={props.artifactTypesItem.name}
          className={cn('size-6', {
            'opacity-40': isEmpty || props.disabled,
          })}
        />
        <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          {props.artifactTypesItem.name}
        </span>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1">
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
        {options.length > 0 && !props.disabled && (
          <Select
            onValueChange={(special) => props.create(special)}
            value=""
            disabled={props.disabled}
          >
            <SelectTrigger data-slot="select-trigger" asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-5 rounded-md text-muted-foreground hover:bg-element/15 hover:text-element-fg focus-visible:bg-element/15"
                disabled={props.disabled}
                aria-label={`Add ${props.artifactTypesItem.name} main stat`}
              >
                <Icons.Add className="size-3.5" />
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

  if (!special) {
    return null;
  }
  if (props.disabled) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <span className="px-1.5 py-0.5 text-sm leading-tight font-medium">
          {special.name}
        </span>
        {!props.isLast && (
          <Icons.Divide className="size-4 text-muted-foreground/50" />
        )}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 gap-1 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <RemovableChip
            className={cn('text-left', {
              'opacity-75 animate-pulse': props.isLoading,
            })}
            disabled={props.disabled}
          >
            {special.name}
          </RemovableChip>
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
