import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { CharacterPlans, WeaponPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { ShortNumberInput } from '@/components/short-number-input';

type Props = { build: CharacterPlans };
export function Weapons({ build }: Props) {
  const query = useQuery({
    queryKey: ['character_plans', build.id, 'weapons'],
    queryFn: () =>
      pbClient.collection<WeaponPlans>('weapon_plans').getFullList({
        filter: `character_plan = '${build.id}'`,
      }),
  });
  const weapons = useLiveQuery(
    () => db.weapons.bulkGet(query.data?.map((w) => w.weapon) ?? []),
    [query.data],
  );
  if (query.isPending || !weapons) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-2xl font-semibold">Weapons</span>
      <div className="flex gap-4 justify-start flex-wrap w-full">
        {query.data?.map(
          (w, i) =>
            w &&
            weapons[i] && (
              <div key={w.id}>
                <div className="flex gap-2 items-center align-middle">
                  <CollectionAvatar
                    collectionName="weapons"
                    recordId={weapons[i].id}
                    fileName={weapons[i].icon}
                    name={weapons[i].name}
                    size={32}
                    className="size-8"
                  />
                  <span>{weapons[i].name}</span>
                </div>
                <div className="flex gap-2 items-center align-middle">
                  <div>
                    <span>Level</span>
                    <div className="flex gap-1 items-center">
                      <ShortNumberInput
                        value={w.level_current}
                        min={0}
                        max={90}
                      />
                      <Icons.right className="size-4" />
                      <ShortNumberInput
                        value={w.level_target}
                        min={0}
                        max={90}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div>
                      <span>Refinement</span>
                      <ShortNumberInput
                        value={w.refinement_current}
                        min={0}
                        max={5}
                      />
                      <Icons.right className="size-4" />
                      <ShortNumberInput
                        value={w.refinement_target}
                        min={0}
                        max={5}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
