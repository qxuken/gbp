import {
  closestCorners,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WritableDraft } from 'immer';
import { Fragment, PropsWithChildren } from 'react';

import { useArtifactSetsItem } from '@/api/dictionaries/hooks';
import { useArtifactSetsPlansMutation } from '@/api/plans/artifact-sets-plans';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { removeByPredMut } from '@/lib/array-remove-mut';
import { handleReorderImmer } from '@/lib/handle-reorder';
import { cn } from '@/lib/utils';
import { useSetFilters } from '@/store/plans/filters';

import { ArtifactSetPicker } from './artifact-set-picker';
import { SectionAddButton, SectionEmpty, SectionHeader } from './section';

const MAX_SETS = 10;

type Props = {
  planId: string;
  artifactSetsPlans?: ArtifactSetsPlans[];
  disabled?: boolean;
};
export function ArtifactSets(props: Props) {
  const mutation = useArtifactSetsPlansMutation(
    props.planId,
    props.artifactSetsPlans,
    props.disabled,
  );

  return (
    <div className="flex flex-col gap-1.5">
      <SectionHeader
        icon={Icons.Artifact}
        title="Artifacts"
        isError={mutation.isError}
        retry={mutation.retry}
        disabled={props.disabled}
        action={
          mutation.records.length < MAX_SETS && (
            <ArtifactSetPicker
              title="New artifact set"
              onSelect={(as) => mutation.create([as])}
            >
              <SectionAddButton
                disabled={props.disabled}
                aria-label="Add artifact set"
              />
            </ArtifactSetPicker>
          )
        }
      />
      {mutation.records.length === 0 ? (
        <SectionEmpty>No artifact set picked yet</SectionEmpty>
      ) : (
        <div className="grid w-full gap-0.5">
          <ArtifactSetsFull
            planId={props.planId}
            mutation={mutation}
            disabled={props.disabled}
          />
        </div>
      )}
    </div>
  );
}

export function ArtifactSetsFull(
  props: Pick<Props, 'disabled' | 'planId'> & {
    mutation: ReturnType<typeof useArtifactSetsPlansMutation>;
  },
) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    handleReorderImmer(event, props.mutation.records, props.mutation.update);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={props.mutation.records}
        strategy={verticalListSortingStrategy}
      >
        {props.mutation.records.map((as, i) => (
          <Fragment key={as.id}>
            <ArtifactSetDrag
              artifactSetPlan={as}
              isLoading={as.isOptimistic}
              disabled={
                props.disabled ||
                as.isOptimisticBlocked ||
                props.mutation.records.length === 1
              }
            >
              <ArtifactSetPlan
                artifactSetPlan={as}
                update={(cb) => props.mutation.update(as, cb)}
                delete={() => props.mutation.delete(as.id)}
                isLoading={as.isOptimistic}
                disabled={as.isOptimisticBlocked || props.disabled}
              />
            </ArtifactSetDrag>
            {props.mutation.records.length - 1 !== i && (
              <Separator className="my-1 bg-border/70" />
            )}
          </Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function ArtifactSetDrag(
  props: PropsWithChildren<
    Pick<ArtifactSetPlanProps, 'artifactSetPlan' | 'isLoading' | 'disabled'>
  >,
) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.artifactSetPlan.id,
    disabled: props.disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('w-full relative', {
        'animate-pulse': props.isLoading,
        'opacity-50': isDragging,
      })}
    >
      <div className="group/item flex items-center">
        {!props.disabled ? (
          <Icons.DragVertical
            className="size-4 shrink-0 cursor-grab self-center text-muted-foreground/70 transition-opacity hoverable:opacity-0 hoverable:group-hover/item:opacity-100 hoverable:focus:opacity-100"
            {...listeners}
            {...attributes}
          />
        ) : (
          <div className="size-4 shrink-0" />
        )}
        {props.children}
      </div>
    </div>
  );
}

type ArtifactSetPlanProps = {
  artifactSetPlan: ArtifactSetsPlans;
  update: (cb: (v: WritableDraft<ArtifactSetsPlans>) => void) => void;
  delete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};
function ArtifactSetPlan(props: ArtifactSetPlanProps) {
  const artifactSets = props.artifactSetPlan.artifactSets;
  const artifactSetsSet = new Set(artifactSets);
  const deleteSet = (setId: string) => {
    switch (artifactSets.length) {
      case 1:
        return props.delete();
      case 2:
        return props.update((state) => {
          removeByPredMut(state.artifactSets, (it) => it == setId);
        });
    }
  };

  const addSet = (setId: string) => {
    if (artifactSets.length == 1) {
      props.update((state) => {
        state.artifactSets.push(setId);
      });
    }
  };

  return (
    <div
      className={cn('flex-1', {
        'animate-pulse': props.isLoading,
        'mb-1': artifactSets.length !== 1,
      })}
    >
      {artifactSets.map((artifactSet, _, items) => (
        <ArtifactSetFull
          key={artifactSet}
          artifactSet={artifactSet}
          add={addSet}
          ignoreArtifacts={artifactSetsSet}
          isSplit={items.length == 2}
          delete={() => deleteSet(artifactSet)}
          disabled={props.disabled}
        />
      ))}
    </div>
  );
}

type SplitButtonProps = {
  enabled?: boolean;
  onSelect(weaponId: string): void;
  ignoreArtifacts: Set<string>;
  isFullMode?: boolean;
};
export function SplitButton(props: SplitButtonProps) {
  if (!props.enabled) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="size-6">
          <ArtifactSetPicker
            title="Split into two pieces"
            onSelect={props.onSelect}
            ignoreArtifacts={props.ignoreArtifacts}
          >
            <Button
              variant="ghost"
              size="icon"
              className="opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 size-6"
            >
              <Icons.SplitY />
            </Button>
          </ArtifactSetPicker>
        </div>
      </TooltipTrigger>
      <TooltipContent> Split into two pieces </TooltipContent>
    </Tooltip>
  );
}

type ArtifactSetProps = {
  artifactSet: string;
  add(weaponId: string): void;
  isSplit?: boolean;
  delete: () => void;
  ignoreArtifacts: Set<string>;
  disabled?: boolean;
  skipConfirmation?: boolean;
};

function ArtifactSetFull(props: ArtifactSetProps) {
  const artifactSet = useArtifactSetsItem(props.artifactSet);
  const setFilters = useSetFilters();
  if (!artifactSet) {
    return null;
  }
  return (
    <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-foreground/4">
      <div
        className="cursor-pointer"
        onClick={() =>
          setFilters((state) =>
            state.artifactSets.has(artifactSet.id)
              ? state.artifactSets.delete(artifactSet.id)
              : state.artifactSets.add(artifactSet.id),
          )
        }
      >
        <CollectionAvatar
          record={artifactSet}
          fileName={artifactSet.icon}
          name={artifactSet.name}
          className={cn(
            'size-12 shrink-0 rounded-lg bg-gradient-to-br',
            artifactSet.rarity === 5
              ? 'from-rarity-5/30 to-rarity-5/5'
              : artifactSet.rarity === 4
                ? 'from-rarity-4/28 to-rarity-4/5'
                : 'from-rarity-3/28 to-rarity-3/5',
          )}
        />
      </div>
      <div className="min-w-0">
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {artifactSet.name}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="rounded bg-foreground/6 px-1 text-[10px] font-semibold tracking-wide text-muted-foreground tabular-nums">
            {props.isSplit ? '2 pcs' : '4 pcs'}
          </span>
          <SplitButton
            enabled={!props.isSplit && !props.disabled}
            onSelect={props.add}
            ignoreArtifacts={props.ignoreArtifacts}
            isFullMode
          />
        </div>
      </div>
      {!props.disabled && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 self-center p-1 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive data-[state=open]:opacity-100 hoverable:opacity-0 hoverable:group-hover/item:opacity-100 hoverable:focus-visible:opacity-100"
              aria-label={`Remove ${artifactSet.name}`}
            >
              <Icons.Remove />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="top">
            <Button
              variant="destructive"
              className="w-full"
              onClick={props.delete}
            >
              Yes, I really want to delete
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export function ArtifactSetShort(props: ArtifactSetProps) {
  const artifactSet = useArtifactSetsItem(props.artifactSet);
  const setFilters = useSetFilters();
  if (!artifactSet) {
    return null;
  }
  return (
    <div className="group/set-row flex w-full min-w-0 items-center gap-2">
      <div
        className="cursor-pointer"
        onClick={() =>
          setFilters((state) =>
            state.artifactSets.has(artifactSet.id)
              ? state.artifactSets.delete(artifactSet.id)
              : state.artifactSets.add(artifactSet.id),
          )
        }
      >
        <CollectionAvatar
          record={artifactSet}
          fileName={artifactSet.icon}
          name={artifactSet.name}
          className="size-9 shrink-0 rounded-md"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center justify-between gap-1">
          <span className="min-w-0 flex-1 truncate text-xs leading-tight font-medium">
            {artifactSet.name}
          </span>
          {props.skipConfirmation ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-5 shrink-0 p-1 text-muted-foreground transition-[color,background-color,opacity] hover:bg-destructive/10 hover:text-destructive data-[state=open]:bg-destructive/10 data-[state=open]:text-destructive data-[state=open]:opacity-100 hoverable:opacity-0 hoverable:group-hover/set-row:opacity-100 hoverable:focus-visible:opacity-100"
              onClick={props.delete}
              disabled={props.disabled}
            >
              <Icons.Remove />
            </Button>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 shrink-0 p-1 text-muted-foreground transition-[color,background-color,opacity] hover:bg-destructive/10 hover:text-destructive data-[state=open]:bg-destructive/10 data-[state=open]:text-destructive data-[state=open]:opacity-100 hoverable:opacity-0 hoverable:group-hover/set-row:opacity-100 hoverable:focus-visible:opacity-100"
                  disabled={props.disabled}
                >
                  <Icons.Remove />
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
          )}
        </div>
      </div>
    </div>
  );
}
