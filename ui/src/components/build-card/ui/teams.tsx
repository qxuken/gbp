import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { TeamPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { queryClient } from '@/main';

import { CharacterPicker } from './character-picker';

type CharacterProps = {
  characterId: string;
  deleteMember?: () => void;
  updateIsPending?: boolean;
};
function Character({
  characterId,
  deleteMember,
  updateIsPending,
}: CharacterProps) {
  const character = useLiveQuery(
    () => db.characters.get(characterId),
    [characterId],
  );
  if (!character) {
    return null;
  }

  return (
    <div className="grid justify-items-center relative">
      <CollectionAvatar
        record={character}
        fileName={character.icon}
        name={character.name}
        size={40}
        className="size-10"
      />
      <span className="text-center text-xs opacity-85">{character.name}</span>
      {deleteMember && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
              disabled={updateIsPending}
            >
              <Icons.Remove />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="top">
            <Button
              variant="destructive"
              className="w-full"
              onClick={deleteMember}
              disabled={updateIsPending}
            >
              Yes i really want to delete
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

type TeamProps = {
  buildId: string;
  teamId: string;
  characterId: string;
};
function Team({ buildId, teamId, characterId }: TeamProps) {
  const queryKey = ['characterPlans', buildId, 'teamPlans', teamId];

  const {
    mutate: deleteTeam,
    isPending: deleteIsPending,
    isSuccess: isDeleted,
  } = useMutation({
    mutationFn: () =>
      pbClient.collection<TeamPlans>('teamPlans').delete(teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['characterPlans', buildId, 'teamPlans'],
        exact: true,
      });
      queryClient.removeQueries({ queryKey });
    },
    onError: notifyWithRetry(() => {
      deleteTeam();
    }),
  });

  const query = useQuery({
    queryKey,
    queryFn: () => pbClient.collection<TeamPlans>('teamPlans').getOne(teamId),
    enabled: !isDeleted,
  });

  const {
    variables,
    mutate: updateTeam,
    isPending: updateIsPending,
  } = useMutation({
    mutationFn: (plan: TeamPlans) =>
      pbClient.collection<TeamPlans>('teamPlans').update(teamId, plan),
    onSuccess: (data) => queryClient.setQueryData(queryKey, data),
    onError: notifyWithRetry((v) => {
      updateTeam(v);
    }),
  });

  const team = variables || query.data;

  const ignoreCharacters = new Set([characterId, ...(team?.characters ?? [])]);

  const isPending = deleteIsPending || updateIsPending;

  const addMember = (characterId: string) => {
    if (!team || deleteIsPending || updateIsPending) {
      return;
    }
    if (team.characters.includes(characterId)) {
      return;
    }
    updateTeam({
      ...team,
      characters: [...team.characters, characterId],
    });
  };

  const deleteMember = (characterId: string) => {
    if (!team || deleteIsPending || updateIsPending) {
      return;
    }
    if (team.characters.length === 1) {
      deleteTeam();
    } else {
      updateTeam({
        ...team,
        characters: team.characters.filter((c) => c !== characterId),
      });
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <div className="grid gap-2 grid-cols-4">
      <Character characterId={characterId} updateIsPending={isPending} />
      {team?.characters.map((tm) => (
        <Character
          key={tm}
          characterId={tm}
          deleteMember={() => deleteMember(tm)}
          updateIsPending={isPending}
        />
      ))}
      {team && team.characters.length < 3 && (
        <CharacterPicker
          title="Add new team member"
          onSelect={addMember}
          ignoreCharacters={ignoreCharacters}
        >
          <Button
            size="icon"
            variant="ghost"
            className="size-full opacity-50 hover:opacity-100 focus:opacity-100 hover:outline focus:outline"
            disabled={isPending}
          >
            <Icons.Add />
          </Button>
        </CharacterPicker>
      )}
    </div>
  );
}

type Props = { buildId: string; characterId: string };
export function Teams({ buildId, characterId }: Props) {
  const queryKey = ['characterPlans', buildId, 'teamPlans'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<TeamPlans>('teamPlans').getFullList({
        filter: `characterPlan = '${buildId}'`,
        fields: 'id',
      }),
  });

  const { mutate: createTeam, isPending: createIsPending } = useMutation({
    mutationFn: (characterId: string) =>
      pbClient.collection<TeamPlans>('teamPlans').create({
        characterPlan: buildId,
        characters: [characterId],
      }),
    onSuccess(data) {
      queryClient.setQueryData([...queryKey, data.id], data);
      return queryClient.invalidateQueries({ queryKey });
    },
    onError: notifyWithRetry((v) => {
      createTeam(v);
    }),
  });

  const teams = query.data;

  const ignoreCharacters = new Set([characterId]);

  return (
    <div className="flex flex-col gap-2 group/teams">
      <div className="flex items-center gap-1">
        <span className="text-sm">Teams</span>
        <CharacterPicker
          title="Create new team"
          onSelect={createTeam}
          ignoreCharacters={ignoreCharacters}
        >
          <Button
            size="icon"
            variant="ghost"
            className="size-6 opacity-50 hover:opacity-100 focus:opacity-100"
            disabled={createIsPending}
          >
            <Icons.Add />
          </Button>
        </CharacterPicker>
      </div>
      {teams && teams.length > 0 && (
        <div className="grid gap-4 w-full">
          {teams.map((tp, i) => (
            <>
              <Team
                key={tp.id}
                buildId={buildId}
                teamId={tp.id}
                characterId={characterId}
              />
              {teams.length - 1 !== i && (
                <Separator className="bg-muted-foreground rounded-lg mb-1 opacity-50" />
              )}
            </>
          ))}
        </div>
      )}
    </div>
  );
}
