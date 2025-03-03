import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { ClientResponseError } from 'pocketbase';
import { toast } from 'sonner';

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
import { cn } from '@/lib/utils';
import { queryClient } from '@/main';

import { CharacterPicker } from './character-picker';

type CharacterProps = {
  characterId: string;
  deleteMember(): void;
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
    <div className="grid justify-items-center relative group/character">
      <CollectionAvatar
        collectionName="characters"
        recordId={character.id}
        fileName={character.icon}
        name={character.name}
        size={40}
        className="size-10"
      />
      <span className="text-center text-xs opacity-85">{character.name}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 size-6 p-1 opacity-75 invisible group-hover/character:visible group-focus-within/character:visible focus:visible hover:outline disabled:visible data-[state=open]:visible data-[state=open]:outline data-[state=open]:animate-pulse"
            disabled={updateIsPending}
          >
            <Icons.remove />
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
    </div>
  );
}

type TeamProps = { buildId: string; teamId: string };
function Team({ buildId, teamId }: TeamProps) {
  const queryKey = ['character_plans', buildId, 'team_plans', teamId];

  const {
    mutate: deleteTeam,
    isPending: deleteIsPending,
    isSuccess: isDeleted,
  } = useMutation({
    mutationFn: () =>
      pbClient.collection<TeamPlans>('team_plans').delete(teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['character_plans', buildId, 'team_plans'],
        exact: true,
      });
      queryClient.removeQueries({ queryKey });
    },
    onError(error) {
      if (error instanceof ClientResponseError && !error.isAbort) {
        toast.error(error.message, {
          action: {
            label: 'Retry',
            onClick: () => {
              deleteTeam();
            },
          },
        });
      }
    },
  });

  const query = useQuery({
    queryKey,
    queryFn: () => pbClient.collection<TeamPlans>('team_plans').getOne(teamId),
    enabled: !isDeleted,
  });

  const {
    variables,
    mutate: updateTeam,
    isPending: updateIsPending,
  } = useMutation({
    mutationFn: (plan: TeamPlans) =>
      pbClient.collection<TeamPlans>('team_plans').update(teamId, plan),
    onSuccess: (data) => queryClient.setQueryData(queryKey, data),
    onError(error, variables) {
      if (error instanceof ClientResponseError && !error.isAbort) {
        toast.error(error.message, {
          action: {
            label: 'Retry',
            onClick: () => {
              updateTeam(variables);
            },
          },
        });
      }
    },
  });

  const team = variables || query.data;

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

  const isPending = deleteIsPending || updateIsPending;

  return (
    <div className="grid gap-2 grid-cols-3 group/team">
      {team?.characters.map((tm) => (
        <Character
          key={tm}
          characterId={tm}
          deleteMember={() => deleteMember(tm)}
          updateIsPending={isPending}
        />
      ))}
      {team && team.characters.length < 3 && (
        <CharacterPicker title="Add new team member" onSelect={addMember}>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'size-full opacity-75 hover:opacity-100 focus:opacity-100 invisible group-hover/team:visible outline',
            )}
            disabled={isPending}
          >
            <Icons.add />
          </Button>
        </CharacterPicker>
      )}
    </div>
  );
}

type Props = { buildId: string };
export function Teams({ buildId }: Props) {
  const queryKey = ['character_plans', buildId, 'team_plans'];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<TeamPlans>('team_plans').getFullList({
        filter: `character_plan = '${buildId}'`,
        fields: 'id',
      }),
  });

  const { mutate: createTeam, isPending: createIsPending } = useMutation({
    mutationFn: (characterId: string) =>
      pbClient.collection<TeamPlans>('team_plans').create({
        character_plan: buildId,
        characters: [characterId],
      }),
    onSuccess(data) {
      queryClient.setQueryData([...queryKey, data.id], data);
      return queryClient.invalidateQueries({ queryKey });
    },
    onError(error, variables) {
      if (error instanceof ClientResponseError && !error.isAbort) {
        toast.error(error.message, {
          action: {
            label: 'Retry',
            onClick: () => {
              createTeam(variables);
            },
          },
        });
      }
    },
  });

  const teams = query.data;

  return (
    <div className="flex flex-col gap-2 group/teams">
      <div className="flex items-center gap-1">
        <span className="text-sm">Teams</span>
        <CharacterPicker title="Create new team" onSelect={createTeam}>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'size-6 opacity-75 hover:opacity-100 focus:opacity-100 invisible group-hover/teams:visible',
              {
                ['visible opacity-50']: !teams?.length,
              },
            )}
            disabled={createIsPending}
          >
            <Icons.add />
          </Button>
        </CharacterPicker>
      </div>
      {teams && teams.length > 0 && (
        <div className="grid gap-4 w-full">
          {teams.map((tp) => (
            <Team key={tp.id} buildId={buildId} teamId={tp.id} />
          ))}
        </div>
      )}
    </div>
  );
}
