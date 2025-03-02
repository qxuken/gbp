import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { CharacterPlans, TeamPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';

type CharacterProps = { characterId: string };
function Character({ characterId }: CharacterProps) {
  const character = useLiveQuery(
    () => db.characters.get(characterId),
    [characterId],
  );
  if (!character) {
    return null;
  }

  return (
    <div>
      <CollectionAvatar
        collectionName="characters"
        recordId={character.id}
        fileName={character.icon}
        name={character.name}
        size={32}
        className="size-8"
      />
      <span>{character.name}</span>
    </div>
  );
}

type Props = { build: CharacterPlans };
export function Teams({ build }: Props) {
  const query = useQuery({
    queryKey: ['character_plans', build.id, 'team_plans'],
    queryFn: () =>
      pbClient.collection<TeamPlans>('team_plans').getFullList({
        filter: `character_plan = '${build.id}'`,
      }),
  });
  if (query.isPending) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">Teams</span>
      <div className="flex flex-col gap-4 flex-wrap w-full">
        {query.data?.map((tp, i) => (
          <div key={tp.id}>
            <span>Team #{i}</span>
            <div className="flex gap-1">
              {tp.characters.map((tm) => (
                <Character key={tm} characterId={tm} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
