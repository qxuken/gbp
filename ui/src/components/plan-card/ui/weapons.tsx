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
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { useWeaponsItem } from '@/api/dictionaries/hooks';
import { useWeaponPlansMutation } from '@/api/plans/weapon-plans';
import { WeaponPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { handleReorderImmer } from '@/lib/handle-reorder';
import { mutateFieldImmer } from '@/lib/mutate-field';
import { cn } from '@/lib/utils';

import { DoubleInputLabeled } from './double-input-labeled';
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    handleReorderImmer(event, mutation.records, mutation.update);
  }

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
      <div className="grid gap-2 w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={mutation.records}
            strategy={verticalListSortingStrategy}
          >
            {mutation.records.map((wp) => (
              <Weapon
                key={wp.id}
                planId={props.planId}
                weaponPlan={wp}
                update={(cb) => mutation.update(wp, cb)}
                delete={() => mutation.delete(wp.id)}
                isLoading={wp.isOptimistic}
                disabled={props.disabled || wp.isOptimisticBlocked}
              />
            ))}
          </SortableContext>
        </DndContext>
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

  if (!weapon) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('w-full', {
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
        <div className="relative">
          <CollectionAvatar
            record={weapon}
            fileName={weapon.icon}
            name={weapon.name}
            className="size-12 me-2"
          />
          <WeaponTag
            value={props.weaponPlan.tag}
            update={mutateFieldImmer(props.update, 'tag')}
          />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <span className="flex-1">{weapon.name}</span>
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
                  Yes i really want to delete
                </Button>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center justify-between gap-1">
            <DoubleInputLabeled
              name="Level"
              min={0}
              max={90}
              current={props.weaponPlan.levelCurrent}
              target={props.weaponPlan.levelTarget}
              onCurrentChange={mutateFieldImmer(props.update, 'levelCurrent')}
              onTargetChange={mutateFieldImmer(props.update, 'levelTarget')}
              disabled={props.disabled}
            />
            <DoubleInputLabeled
              name="Refinement"
              min={1}
              max={5}
              current={props.weaponPlan.refinementCurrent}
              target={props.weaponPlan.refinementTarget}
              onCurrentChange={mutateFieldImmer(
                props.update,
                'refinementCurrent',
              )}
              onTargetChange={mutateFieldImmer(
                props.update,
                'refinementTarget',
              )}
              disabled={props.disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type WeaponTagProps = {
  value?: WeaponPlans['tag'];
  update(v: WeaponPlans['tag']): void;
};
function WeaponTag({ value, update }: WeaponTagProps) {
  const [isActive, setIsActive] = useState(false);
  const activate = () => setIsActive(true);
  const deactivate = () => setIsActive(false);
  const select = (v: WeaponPlans['tag']) => {
    update(v);
    deactivate();
  };
  let component;
  if (isActive) {
    component = (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => select('none')}
              className={cn('cursor-pointer', {
                'opacity-50': value == 'none',
              })}
            >
              <Icons.Remove className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Delete tag</span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => select('current')}
              className={cn('cursor-pointer text-[12px]', {
                'opacity-50': !value || value == 'current',
              })}
            >
              C
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Current</span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => select('target')}
              className={cn('cursor-pointer text-[12px]', {
                'opacity-50': value == 'target',
              })}
            >
              W
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Want</span>
          </TooltipContent>
        </Tooltip>
      </>
    );
  } else if (value === 'current') {
    component = <span className="text-[8px]">C</span>;
  } else if (value === 'target') {
    component = <span className="text-[8px]">W</span>;
  } else {
    component = <span className="size-3 p-0"></span>;
  }
  const initalStyles = {
    top: 0,
    x: 0,
    width: 14,
    height: 14,
    scale: 1,
  };
  const activeStyles = {
    top: -3,
    x: -19,
    width: 52,
    height: 20,
    scale: 1.25,
  };
  return (
    <motion.div
      onMouseOver={activate}
      onMouseLeave={deactivate}
      onFocus={activate}
      onBlur={deactivate}
      initial={initalStyles}
      animate={isActive ? activeStyles : initalStyles}
      transition={{ type: 'spring', duration: 0.2, bounce: 0.3 }}
      className={cn(
        'absolute flex justify-center items-center gap-0.5 leading-none rounded-2xl border border-black dark:border-white',
        {
          'border-dashed': !value,
          'bg-background': isActive,
        },
      )}
      tabIndex={isActive ? -1 : 0}
    >
      {component}
    </motion.div>
  );
}
