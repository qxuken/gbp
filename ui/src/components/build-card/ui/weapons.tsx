import { Popover } from '@radix-ui/react-popover';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { WeaponPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
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

type ShortItem = Pick<WeaponPlans, 'id' | 'weapon'>;
type Props = { buildId: string; weaponType: string; enabled?: boolean };
export function Weapons({ buildId, weaponType, enabled }: Props) {
  const queryKey = ['characterPlans', buildId, 'weapons'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<ShortItem>('weaponPlans').getFullList({
        filter: `characterPlan = '${buildId}'`,
        fields: 'id, weapon',
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

  const { mutate } = useMutation({
    mutationFn: (weaponId: string) =>
      pbClient.collection<WeaponPlans>('weaponPlans').create({
        characterPlan: buildId,
        weapon: weaponId,
        levelCurrent: 0,
        levelTarget: 90,
        refinementCurrent: 1,
        refinementTarget: 5,
      }),
    onSuccess(data) {
      queryClient.setQueryData([...queryKey, data.id], data);
      return queryClient.invalidateQueries({ queryKey });
    },
    onError: notifyWithRetry((v) => {
      mutate(v);
    }),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <span className="text-sm">Weapons</span>
        <WeaponPicker
          title="New weapon"
          onSelect={mutate}
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
        {weapons.map((wp) => (
          <Weapon key={wp.id} buildId={buildId} weaponPlanId={wp.id} />
        ))}
      </div>
    </div>
  );
}

type WeaponProps = { weaponPlanId: string; buildId: string };
function Weapon({ weaponPlanId, buildId }: WeaponProps) {
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
  if (!weapon || !query.data || isDeleted) {
    return <Skeleton className="w-full h-8"></Skeleton>;
  }

  const weaponPlan = variables || query.data;

  return (
    <div
      className={cn('w-full', {
        ['animate-pulse']: deleteIsPending,
      })}
    >
      <div className="flex gap-2">
        <CollectionAvatar
          record={weapon}
          fileName={weapon.icon}
          name={weapon.name}
          className="size-12"
        />
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span>{weapon.name}</span>
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
      <div className="px-1.5 w-12 h-9">
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
