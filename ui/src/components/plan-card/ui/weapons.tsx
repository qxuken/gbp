import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
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
import { Popover } from '@radix-ui/react-popover';
import { WritableDraft } from 'immer';
import { PropsWithChildren, useMemo } from 'react';

import { useWeaponsItem } from '@/api/dictionaries/hooks';
import { useWeaponPlansMutation } from '@/api/plans/weapon-plans';
import { WeaponPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { handleReorderImmer } from '@/lib/handle-reorder';
import { cn } from '@/lib/utils';

import { WeaponPicker } from './weapon-picker';

const MAX_WEAPONS = 10;

type Props = {
  planId: string;
  weaponType: string;
  weaponPlansPlans?: WeaponPlans[];
  disabled?: boolean;
};
export function Weapons(props: Props) {
  const mutation = useWeaponPlansMutation(
    props.planId,
    props.weaponPlansPlans,
    props.disabled,
  );

  const ignoreWeapons = useMemo(
    () => new Set(mutation.records.map((w) => w.weapon)),
    [mutation.records],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <span
          className={cn('text-sm', {
            'text-rose-700': mutation.isError,
          })}
        >
          Weapons
        </span>
        {mutation.records.length < MAX_WEAPONS && (
          <WeaponPicker
            title="New weapon"
            onSelect={mutation.create}
            weaponTypeId={props.weaponType}
            ignoreWeapons={ignoreWeapons}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 disabled:opacity-25"
              disabled={props.disabled}
            >
              <Icons.Add />
            </Button>
          </WeaponPicker>
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
      <div className="grid w-full gap-2">
        <WeaponsFull
          planId={props.planId}
          mutation={mutation}
          disabled={props.disabled}
        />
      </div>
    </div>
  );
}

function WeaponsFull(
  props: Pick<Props, 'disabled' | 'planId'> & {
    mutation: ReturnType<typeof useWeaponPlansMutation>;
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
        {props.mutation.records.map((wp) => (
          <WeaponDrag
            key={wp.id}
            weaponPlan={wp}
            isLoading={wp.isOptimistic}
            disabled={
              props.disabled ||
              wp.isOptimisticBlocked ||
              props.mutation.records.length === 1
            }
          >
            <Weapon
              planId={props.planId}
              weaponPlan={wp}
              update={(cb) => props.mutation.update(wp, cb)}
              delete={() => props.mutation.delete(wp.id)}
              isLoading={wp.isOptimistic}
              disabled={props.disabled || wp.isOptimisticBlocked}
            />
          </WeaponDrag>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function WeaponDrag(
  props: PropsWithChildren<
    Pick<WeaponProps, 'weaponPlan' | 'isLoading' | 'disabled'>
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
    id: props.weaponPlan.id,
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
      <div className="flex">
        {!props.disabled ? (
          <Icons.Drag
            className="rotate-90 py-1 size-6 self-center"
            {...listeners}
            {...attributes}
          />
        ) : (
          <div className="py-1 size-6" />
        )}
        {props.children}
      </div>
    </div>
  );
}

type WeaponProps = {
  planId: string;
  weaponPlan: WeaponPlans;
  isLoading?: boolean;
  disabled?: boolean;
  update(cb: (v: WritableDraft<WeaponPlans>) => void): void;
  delete(): void;
};

function Weapon(props: WeaponProps) {
  const weapon = useWeaponsItem(props.weaponPlan.weapon);

  if (!weapon) return null;

  return (
    <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
      <CollectionAvatar
        record={weapon}
        fileName={weapon.icon}
        name={weapon.name}
        className="size-12 shrink-0"
      />
      <div className="min-w-0">
        <span className="min-w-0 text-balance text-base">{weapon.name}</span>
      </div>
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
            disabled={props.disabled}
            onClick={props.delete}
          >
            Yes, I really want to delete
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
