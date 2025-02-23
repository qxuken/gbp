import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { CharacterPlans, TeamMembers, TeamPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Badge } from '@/components/ui/badge';

type CharacterProps = { characterId: string; roleId: string };
function Character({ characterId, roleId }: CharacterProps) {
  const res = useLiveQuery(
    () =>
      Promise.all([
        db.characters.get(characterId),
        db.characterRoles.get(roleId),
      ]),
    [characterId, roleId],
  );
  if (!res) {
    return null;
  }

  const [character, role] = res;
  if (!character || !role) {
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
      <Badge>{role.name}</Badge>
    </div>
  );
}

type Props = { build: CharacterPlans };
export function Teams({ build }: Props) {
  const query = useQuery({
    queryKey: ['character_plans', build.id, 'team_plans'],
    queryFn: () =>
      pbClient
        .collection<
          TeamPlans & { expand: { team_members: TeamMembers[] } }
        >('team_plans')
        .getFullList({
          filter: `character_plan = '${build.id}'`,
          expand: 'team_members',
        }),
  });
  if (query.isPending) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-2xl font-semibold">Teams</span>
      <div className="flex flex-col gap-4 flex-wrap w-full">
        {query.data?.map((tp, i) => (
          <div key={tp.id}>
            <span>Team #{i}</span>
            <div className="flex gap-1">
              {tp.expand.team_members.map((tm) => (
                <Character
                  key={tm.id}
                  characterId={tm.character}
                  roleId={tm.character_role}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
