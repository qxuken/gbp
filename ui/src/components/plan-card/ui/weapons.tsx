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

import { SectionAddButton, SectionEmpty, SectionHeader } from './section';
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
    <div className="flex flex-col gap-1.5">
      <SectionHeader
        icon={Icons.Weapon}
        title="Weapons"
        isError={mutation.isError}
        retry={mutation.retry}
        disabled={props.disabled}
        action={
          mutation.records.length < MAX_WEAPONS && (
            <WeaponPicker
              title="New weapon"
              onSelect={mutation.create}
              weaponTypeId={props.weaponType}
              ignoreWeapons={ignoreWeapons}
            >
              <SectionAddButton
                disabled={props.disabled}
                aria-label="Add weapon"
              />
            </WeaponPicker>
          )
        }
      />
      {mutation.records.length === 0 ? (
        <SectionEmpty>No weapon picked yet</SectionEmpty>
      ) : (
        <div className="grid w-full gap-0.5">
          <WeaponsFull
            planId={props.planId}
            mutation={mutation}
            disabled={props.disabled}
          />
        </div>
      )}
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
    <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-foreground/4">
      <CollectionAvatar
        record={weapon}
        fileName={weapon.icon}
        name={weapon.name}
        className={cn(
          'size-12 shrink-0 rounded-lg bg-gradient-to-br',
          weapon.rarity === 5
            ? 'from-rarity-5/30 to-rarity-5/5'
            : weapon.rarity === 4
              ? 'from-rarity-4/28 to-rarity-4/5'
              : 'from-muted to-muted/30',
        )}
      />
      <div className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {weapon.name}
        </span>
      </div>
      {!props.disabled && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 p-1 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive data-[state=open]:opacity-100 hoverable:opacity-0 hoverable:group-hover/item:opacity-100 hoverable:focus-visible:opacity-100"
              aria-label={`Remove ${weapon.name}`}
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
