import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popover } from '@radix-ui/react-popover';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { WeaponPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AsyncDebounce } from '@/lib/async-debounce';
import { mutateField } from '@/lib/mutate-field';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { cn } from '@/lib/utils';
import { queryClient } from '@/main';

import {
  DoubleInputLabeled,
  DoubleInputLabeledSkeleton,
} from './double-input-labeled';
import { WeaponPicker } from './weapon-picker';

type ShortItem = Pick<WeaponPlans, 'id' | 'weapon' | 'order'>;
type Props = { buildId: string; weaponType: string; enabled?: boolean };

export function Weapons({ buildId, weaponType, enabled }: Props) {
  const queryKey = ['characterPlans', buildId, 'weapons'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<ShortItem>('weaponPlans').getFullList({
        filter: `characterPlan = '${buildId}'`,
        fields: 'id, weapon, order',
        sort: 'order',
      }),
    enabled,
  });
  const weapons = query.data;

  if (query.isPending || !weapons) {
    return <WeaponsSkeleton />;
  }

  return (
    <WeaponsLoaded
      buildId={buildId}
      weaponType={weaponType}
      queryKey={queryKey}
      weapons={weapons}
    />
  );
}

type PropsLoaded = Omit<Props, 'enabled'> & {
  weapons: ShortItem[];
  queryKey: string[];
};

function WeaponsLoaded({
  buildId,
  weaponType,
  weapons,
  queryKey,
}: PropsLoaded) {
  const ignoreWeapons = new Set(weapons.map((it) => it.weapon));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { mutate: createWeapon } = useMutation({
    mutationFn: (weaponId: string) =>
      pbClient.collection<WeaponPlans>('weaponPlans').create({
        characterPlan: buildId,
        weapon: weaponId,
        levelCurrent: 0,
        levelTarget: 90,
        refinementCurrent: 1,
        refinementTarget: 5,
        order: weapons.length + 1,
      }),
    onSuccess(data) {
      queryClient.setQueryData([...queryKey, data.id], data);
      return queryClient.invalidateQueries({ queryKey });
    },
    onError: notifyWithRetry((v) => {
      createWeapon(v);
    }),
  });

  const {
    variables,
    mutate: reorderWeapons,
    isPending: reorderIsPending,
    reset,
  } = useMutation({
    mutationFn(items: ShortItem[]) {
      const batch = pbClient.createBatch();
      for (const it of items) {
        batch
          .collection('weaponPlans')
          .update(it.id, { order: it.order }, { fields: 'id, weapon, order' });
      }
      return batch.send();
    },
    onSuccess: async (data) => {
      const items = data.map((it) => it.body);
      await queryClient.setQueryData(queryKey, items);
      reset();
    },
    onError: notifyWithRetry((v) => {
      reorderWeapons(v);
    }),
  });

  const items = variables || weapons;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      console.error('Invalid drag indices:', {
        oldIndex,
        newIndex,
        active,
        over,
      });
      return;
    }

    reorderWeapons(
      arrayMove(items, oldIndex, newIndex).map((it, i) => ({
        ...it,
        order: i + 1,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <span className="text-sm">Weapons</span>
        <WeaponPicker
          title="New weapon"
          onSelect={createWeapon}
          weaponTypeId={weaponType}
          ignoreWeapons={ignoreWeapons}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 disabled:opacity-25"
          >
            <Icons.Add />
          </Button>
        </WeaponPicker>
      </div>
      <div className="grid gap-2 w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((wp) => (
              <Weapon
                key={wp.id}
                buildId={buildId}
                weaponPlanId={wp.id}
                reorderIsPending={reorderIsPending}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

type WeaponProps = {
  weaponPlanId: string;
  buildId: string;
  reorderIsPending: boolean;
};

function Weapon({ weaponPlanId, buildId, reorderIsPending }: WeaponProps) {
  const queryKey = ['characterPlans', buildId, 'weapons', weaponPlanId];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<WeaponPlans>('weaponPlans').getOne(weaponPlanId),
  });
  const weapon = useLiveQuery(
    () => query.data && db.weapons.get(query.data.weapon),
    [query.data?.id],
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: weaponPlanId,
    disabled: reorderIsPending,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const mutationDebouncer = useMemo(
    () =>
      new AsyncDebounce(
        (update: WeaponPlans) =>
          pbClient
            .collection<WeaponPlans>('weaponPlans')
            .update(weaponPlanId, update),
        1000,
      ),
    [],
  );
  const { variables, mutate } = useMutation({
    mutationFn: (v: WeaponPlans) => mutationDebouncer.run(v),
    onSettled: async (data) =>
      data
        ? queryClient.setQueryData(queryKey, data)
        : queryClient.invalidateQueries({ queryKey }),
    onError: notifyWithRetry((v) => {
      mutate(v);
    }),
  });

  const {
    mutate: deleteWeaponPlan,
    isPending: deleteIsPending,
    isSuccess: isDeleted,
  } = useMutation({
    mutationFn: () => pbClient.collection('weaponPlans').delete(weaponPlanId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['characterPlans', buildId, 'weapons'],
      }),
    onError: notifyWithRetry(() => {
      deleteWeaponPlan();
    }),
  });

  const weaponPlan = variables || query.data;

  if (!weapon || !weaponPlan || isDeleted) {
    return <Skeleton className="w-full h-8"></Skeleton>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('w-full', {
        ['animate-pulse']: deleteIsPending,
        'opacity-50': isDragging,
      })}
    >
      <div className="flex">
        <div className="pt-4">
          <Icons.Drag
            className={cn('rotate-90 size-6 py-1', {
              'opacity-25 animate-pulse': reorderIsPending,
            })}
            {...listeners}
            {...attributes}
          />
        </div>
        <div className="relative">
          <CollectionAvatar
            record={weapon}
            fileName={weapon.icon}
            name={weapon.name}
            className="size-12 me-2"
          />
          <WeaponTag
            value={weaponPlan.tag}
            mutate={mutateField(mutate, weaponPlan, 'tag')}
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
                  disabled={deleteIsPending}
                >
                  {deleteIsPending ? (
                    <Icons.Spinner className="animate-spin" />
                  ) : (
                    <Icons.Remove />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="top">
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deleteIsPending}
                  onClick={() => deleteWeaponPlan()}
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
              current={weaponPlan.levelCurrent}
              target={weaponPlan.levelTarget}
              onCurrentChange={mutateField(mutate, weaponPlan, 'levelCurrent')}
              onTargetChange={mutateField(mutate, weaponPlan, 'levelTarget')}
              disabled={deleteIsPending}
            />
            <DoubleInputLabeled
              name="Refinement"
              min={1}
              max={5}
              current={weaponPlan.refinementCurrent}
              target={weaponPlan.refinementTarget}
              onCurrentChange={mutateField(
                mutate,
                weaponPlan,
                'refinementCurrent',
              )}
              onTargetChange={mutateField(
                mutate,
                weaponPlan,
                'refinementTarget',
              )}
              disabled={deleteIsPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type WeaponTagProps = {
  value?: WeaponPlans['tag'];
  mutate(v: WeaponPlans['tag']): void;
};
function WeaponTag({ value, mutate }: WeaponTagProps) {
  const [isActive, setIsActive] = useState(false);
  const activate = () => setIsActive(true);
  const deactivate = () => setIsActive(false);
  const select = (v: WeaponPlans['tag']) => {
    mutate(v);
    deactivate();
  };
  let comp;
  if (isActive) {
    comp = (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => select(undefined)}
              className={cn('cursor-pointer', { 'opacity-50': !value })}
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
              onClick={() => select('now')}
              className={cn('cursor-pointer text-[12px]', {
                'opacity-50': value === 'now',
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
              onClick={() => select('need')}
              className={cn('cursor-pointer text-[12px]', {
                'opacity-50': value === 'need',
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
  } else if (value === 'now') {
    comp = <span className="text-[8px]">C</span>;
  } else if (value === 'need') {
    comp = <span className="text-[8px]">W</span>;
  } else {
    comp = <span className="size-3 p-0"></span>;
  }
  const initalStyles = {
    top: 0,
    x: 0,
    width: 14,
    height: 14,
  };
  const activeStyles = {
    top: -3,
    x: -19,
    width: 52,
    height: 20,
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
      {comp}
    </motion.div>
  );
}

export function WeaponsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="size-5 rounded-md" />
      </div>
      <div className="grid gap-2 w-full">
        <WeaponSkeleton />
      </div>
    </div>
  );
}

function WeaponSkeleton() {
  return (
    <div className="w-full flex gap-2">
      <div className="pt-2 ps-0.5">
        <Skeleton className="w-4 h-6" />
      </div>
      <div className="px-0.5 w-12 h-11">
        <Skeleton className="size-full rounded-4xl" />
      </div>
      <div className="flex-1 grid">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
        <div className="flex items-center justify-between gap-1">
          <DoubleInputLabeledSkeleton labelLength="w-8" />
          <DoubleInputLabeledSkeleton labelLength="w-18" />
        </div>
      </div>
    </div>
  );
}
