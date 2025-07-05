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
import { Fragment, PropsWithChildren, useMemo } from 'react';

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
import { removeByPredMut } from '@/lib/array-remove-mut';
import { handleReorderImmer } from '@/lib/handle-reorder';
import { cn } from '@/lib/utils';
import { useSetFilters } from '@/store/plans/filters';
import {
  UiPlansMode,
  useUiPlansConfigModeValue,
} from '@/store/ui-plans-config';

import { ArtifactSetPicker } from './artifact-set-picker';

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

  const mode = useUiPlansConfigModeValue();

  const artifacts = useMemo(() => {
    switch (mode) {
      case UiPlansMode.Full:
        return (
          <ArtifactSetsFull
            planId={props.planId}
            mutation={mutation}
            disabled={props.disabled}
          />
        );
      case UiPlansMode.Short:
        return (
          <ArtifactSetsShort
            planId={props.planId}
            mutation={mutation}
            disabled={props.disabled}
          />
        );
    }
  }, [props.planId, mutation, props.disabled]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <span
          className={cn('text-sm', {
            'text-rose-700': mutation.isError,
          })}
        >
          Artifacts
        </span>
        {mode == UiPlansMode.Short && mutation.records.length > 1 && (
          <span className="text-xs text-muted-foreground self-start">
            +{mutation.records.length - 1}
          </span>
        )}
        {mutation.records.length < MAX_SETS && (
          <ArtifactSetPicker
            title="New artifact set"
            onSelect={(as) => mutation.create([as])}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 disabled:opacity-25"
              disabled={props.disabled}
            >
              <Icons.Add />
            </Button>
          </ArtifactSetPicker>
        )}
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
      <div className="grid gap-1 w-full">{artifacts}</div>
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
                isFullMode
              />
            </ArtifactSetDrag>
            {props.mutation.records.length - 1 !== i && (
              <Separator className="bg-muted-foreground rounded-lg mb-1 opacity-50" />
            )}
          </Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
}

export function ArtifactSetsShort(
  props: Pick<Props, 'disabled' | 'planId'> & {
    mutation: ReturnType<typeof useArtifactSetsPlansMutation>;
  },
) {
  const as = props.mutation.records[0];
  if (!as) return null;

  return (
    <ArtifactSetNoDrag isLoading={as.isOptimistic}>
      <ArtifactSetPlan
        artifactSetPlan={as}
        update={(cb) => props.mutation.update(as, cb)}
        delete={() => props.mutation.delete(as.id)}
        isLoading={as.isOptimistic}
        disabled={as.isOptimisticBlocked || props.disabled}
      />
    </ArtifactSetNoDrag>
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
        ['animate-pulse']: props.isLoading,
        'opacity-50': isDragging,
      })}
    >
      <div className="flex">
        <div className="pt-4">
          {!props.disabled ? (
            <Icons.Drag
              className="rotate-90 size-6 py-1"
              {...listeners}
              {...attributes}
            />
          ) : (
            <div className="size-6 py-1" />
          )}
        </div>
        {props.children}
      </div>
    </div>
  );
}

function ArtifactSetNoDrag(
  props: PropsWithChildren<Pick<ArtifactSetPlanProps, 'isLoading'>>,
) {
  return (
    <div
      className={cn('w-full relative', {
        ['animate-pulse']: props.isLoading,
      })}
    >
      <div className="flex">{props.children}</div>
    </div>
  );
}

type ArtifactSetPlanProps = {
  artifactSetPlan: ArtifactSetsPlans;
  update: (cb: (v: WritableDraft<ArtifactSetsPlans>) => void) => void;
  delete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  isFullMode?: boolean;
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

  const Component = useMemo(() => {
    if (props.isFullMode) {
      return ArtifactSetFull;
    } else {
      return ArtifactSetShort;
    }
  }, [props.isFullMode]);

  return (
    <div
      className={cn('flex-1', {
        'animate-pulse': props.isLoading,
        'mb-2': artifactSets.length !== 1,
      })}
    >
      {artifactSets.map((artifactSet, _, items) => (
        <Component
          key={artifactSet}
          artifactSet={artifactSet}
          isSplit={items.length == 2}
          delete={() => deleteSet(artifactSet)}
        />
      ))}
      {artifactSets.length === 1 && (
        <div
          className={cn('min-h-2', {
            'text-center mt-3 mb-4': props.isFullMode,
          })}
        >
          <ArtifactSetPicker
            title="Split into two pieces"
            onSelect={(as) => addSet(as)}
            ignoreArifacts={artifactSetsSet}
          >
            <Button
              variant="ghost"
              size="sm"
              className="opacity-50 transition-opacity focus:opacity-100 hover:opacity-100"
            >
              <Icons.SplitY /> Split into two pieces
            </Button>
          </ArtifactSetPicker>
        </div>
      )}
    </div>
  );
}

type ArtifactSetProps = {
  artifactSet: string;
  isSplit?: boolean;
  delete: () => void;
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
    <div className="flex gap-2 w-full nth-2:mt-1">
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
          className="size-12"
        />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="flex-1">{artifactSet.name}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
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
                Yes i really want to delete
              </Button>
            </PopoverContent>
          </Popover>
        </div>
        <span className="text-xs text-muted-foreground">
          {props.isSplit ? '2 pcs' : '4 pcs'}
        </span>
      </div>
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
    <div className="flex gap-2 w-full nth-2:mt-1">
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
          className="size-8"
        />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="flex-1">{artifactSet.name}</span>
          {props.skipConfirmation ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
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
                  className="size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
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
                  Yes i really want to delete
                </Button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}
