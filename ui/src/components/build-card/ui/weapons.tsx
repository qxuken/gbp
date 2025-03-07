import { Popover } from '@radix-ui/react-popover';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { OnlyId, WeaponPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AsyncDebounce } from '@/lib/async-debounce';
import { mutateField } from '@/lib/mutate-field';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { cn } from '@/lib/utils';
import { queryClient } from '@/main';

import { DoubleInputLabeled } from './double-input-labeled';
import { WeaponPicker } from './weapon-picker';

type WeaponProps = { weaponPlanId: string; buildId: string };
export function Weapon({ weaponPlanId, buildId }: WeaponProps) {
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
    return null;
  }

  const weaponPlan = variables || query.data;

  return (
    <div
      className={cn('w-full group/weapon', {
        ['animate-pulse']: deleteIsPending,
      })}
    >
      <div className="flex gap-2">
        <CollectionAvatar
          record={weapon}
          fileName={weapon.icon}
          name={weapon.name}
          size={48}
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
                  className="size-6 p-1 opacity-75 invisible group-hover/weapon:visible group-focus-within/weapon:visible focus:visible hover:outline disabled:visible data-[state=open]:visible data-[state=open]:outline data-[state=open]:animate-pulse"
                  disabled={deleteIsPending}
                >
                  {deleteIsPending ? (
                    <Icons.spinner className="animate-spin" />
                  ) : (
                    <Icons.remove />
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

type Props = { buildId: string; weaponType: string };
export function Weapons({ buildId, weaponType }: Props) {
  const queryKey = ['characterPlans', buildId, 'weapons'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<OnlyId>('weaponPlans').getFullList({
        filter: `characterPlan = '${buildId}'`,
        fields: 'id',
      }),
  });
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
    <div className="flex flex-col gap-2 group/weapons">
      <div className="flex items-center gap-1">
        <span className="text-sm">Weapons</span>
        <WeaponPicker
          title="New weapon"
          onSelect={mutate}
          weaponTypeId={weaponType}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-6 opacity-75 transition-opacity invisible group-hover/weapons:visible group-focus-within/weapons:visible focus:opacity-100 hover:opacity-100',
              {
                ['visible opacity-50']: query.data?.length === 0,
              },
            )}
          >
            <Icons.add />
          </Button>
        </WeaponPicker>
      </div>
      <div className="grid gap-2 w-full">
        {query.data?.map((wp) => (
          <Weapon key={wp.id} buildId={buildId} weaponPlanId={wp.id} />
        ))}
      </div>
    </div>
  );
}
