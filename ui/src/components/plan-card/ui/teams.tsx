import { WritableDraft } from 'immer';
import { useMemo } from 'react';
import { Fragment } from 'react/jsx-runtime';

import { useCharactersItem } from '@/api/dictionaries/hooks';
import { useTeamPlansMutation } from '@/api/plans/team-plans';
import { Characters, TeamPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { removeByPredMut } from '@/lib/array-remove-mut';
import { cn } from '@/lib/utils';

import { CharacterPicker } from './character-picker';

const MAX_TEAMS = 10;

type Props = {
  planId: string;
  teamPlans?: TeamPlans[];
  character: Characters;
  disabled?: boolean;
};
export function Teams(props: Props) {
  const mutation = useTeamPlansMutation(
    props.planId,
    props.teamPlans,
    props.disabled,
  );
  const ignoreCharacters = useMemo(
    () => new Set([props.character.id]),
    [props.character.id],
  );

  return (
    <div className="flex flex-col gap-2 group/teams">
      <div className="flex items-center gap-1">
        <span
          className={cn('text-sm', {
            'text-rose-700': mutation.isError,
          })}
        >
          Teams
        </span>
        {mutation.records.length < MAX_TEAMS && (
          <CharacterPicker
            title="Create new team"
            onSelect={mutation.create}
            ignoreCharacters={ignoreCharacters}
          >
            <Button
              size="icon"
              variant="ghost"
              className="size-6 opacity-50 hover:opacity-100 focus:opacity-100"
              disabled={props.disabled}
            >
              <Icons.Add />
            </Button>
          </CharacterPicker>
        )}
        <div className="flex-1" />
        {mutation.isError && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 disabled:opacity-25"
            onClick={mutation.retry}
            disabled={props.disabled}
          >
            <Icons.Retry className="text-rose-700" />
          </Button>
        )}
      </div>
      {mutation.records.length > 0 && (
        <div className="grid gap-4 w-full">
          {mutation.records.map((tp, i) => (
            <Fragment key={tp.id}>
              <Team
                planId={props.planId}
                teamPlan={tp}
                character={props.character}
                update={(cb) => mutation.update(tp, cb)}
                delete={() => mutation.delete(tp.id)}
                isLoading={tp.isOptimistic}
                disabled={props.disabled || tp.isOptimisticBlocked}
              />
              {mutation.records.length - 1 !== i && (
                <Separator className="bg-muted-foreground rounded-lg mb-1 opacity-50" />
              )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

type TeamProps = {
  planId: string;
  teamPlan: TeamPlans;
  character: Characters;
  update(cb: (v: WritableDraft<TeamPlans>) => void): void;
  delete(): void;
  isLoading?: boolean;
  disabled?: boolean;
};
function Team(props: TeamProps) {
  const ignoreCharacters = useMemo(
    () => new Set([props.character.id, ...props.teamPlan.characters]),
    [props.character.id, props.teamPlan.characters],
  );

  const addMember = (characterId: string) => {
    if (ignoreCharacters.has(characterId)) {
      return;
    }
    props.update((draft) => {
      draft.characters.push(characterId);
    });
  };

  const deleteMember = (characterId: string) => {
    if (props.teamPlan.characters.length === 1) {
      props.delete();
    } else {
      props.update((draft) => {
        removeByPredMut(draft.characters, (c) => c == characterId);
      });
    }
  };

  return (
    <div className="grid gap-2 grid-cols-4">
      <Character characterId={props.character.id} disabled={props.disabled} />
      {props.teamPlan.characters.map((tm) => (
        <Character
          key={tm}
          characterId={tm}
          delete={() => deleteMember(tm)}
          isLoading={props.isLoading}
          disabled={props.disabled}
        />
      ))}
      {props.teamPlan.characters.length < 3 && (
        <CharacterPicker
          title="Add new team member"
          onSelect={addMember}
          ignoreCharacters={ignoreCharacters}
          disabled={props.disabled}
        >
          <Button
            size="icon"
            variant="ghost"
            className="size-full opacity-50 hover:opacity-100 focus:opacity-100 hover:outline focus:outline"
            disabled={props.disabled}
          >
            <Icons.Add />
          </Button>
        </CharacterPicker>
      )}
    </div>
  );
}

type CharacterProps = {
  characterId: string;
  delete?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};
function Character(props: CharacterProps) {
  const character = useCharactersItem(props.characterId);
  if (!character) {
    return null;
  }

  return (
    <div className="grid justify-items-center relative">
      <CollectionAvatar
        record={character}
        fileName={character.icon}
        name={character.name}
        className="size-10 my-1"
      />
      <span className="text-center text-xs opacity-85">{character.name}</span>
      {props.delete && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
              disabled={props.disabled}
            >
              <Icons.Remove />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="top">
            <Button
              variant="destructive"
              className="w-full"
              onClick={props.delete}
              disabled={props.disabled}
            >
              Yes i really want to delete
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
