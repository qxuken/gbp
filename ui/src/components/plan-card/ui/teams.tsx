import { WritableDraft } from 'immer';
import { useMemo } from 'react';

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
import { useElementScope } from '@/hooks/use-element-scope';
import { removeByPredMut } from '@/lib/array-remove-mut';

import { CharacterPicker } from './character-picker';
import { SectionAddButton, SectionEmpty, SectionHeader } from './section';

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
    <div className="flex flex-col gap-1.5">
      <SectionHeader
        icon={Icons.Team}
        title="Teams"
        isError={mutation.isError}
        retry={mutation.retry}
        disabled={props.disabled}
        action={
          mutation.records.length < MAX_TEAMS && (
            <CharacterPicker
              title="Create new team"
              onSelect={mutation.create}
              ignoreCharacters={ignoreCharacters}
            >
              <SectionAddButton
                disabled={props.disabled}
                aria-label="Add team"
              />
            </CharacterPicker>
          )
        }
      />
      {mutation.records.length === 0 ? (
        <SectionEmpty>No team planned yet</SectionEmpty>
      ) : (
        <div className="grid w-full gap-2 @[38rem]/plan:grid-cols-2">
          {mutation.records.map((tp) => (
            <Team
              key={tp.id}
              planId={props.planId}
              teamPlan={tp}
              character={props.character}
              update={(cb) => mutation.update(tp, cb)}
              delete={() => mutation.delete(tp.id)}
              isLoading={tp.isOptimistic}
              disabled={props.disabled || tp.isOptimisticBlocked}
            />
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
    <div className="grid grid-cols-4 justify-items-center gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-2">
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
      {props.teamPlan.characters.length < 3 && !props.disabled && (
        <CharacterPicker
          title="Add new team member"
          onSelect={addMember}
          ignoreCharacters={ignoreCharacters}
          disabled={props.disabled}
        >
          <Button
            size="icon"
            variant="ghost"
            className="size-12 rounded-lg border border-dashed border-border/70 text-muted-foreground/70 hover:border-element/40 hover:bg-element/10 hover:text-element-fg focus-visible:border-element/40"
            disabled={props.disabled}
            aria-label="Add team member"
          >
            <Icons.Add className="size-4" />
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
  const { element, style } = useElementScope(character?.element);
  if (!character) {
    return null;
  }

  return (
    <div
      className="element-scope grid justify-items-center gap-0.5"
      style={style}
    >
      <div className="group/team-avatar relative size-12 rounded-lg">
        <CollectionAvatar
          record={character}
          fileName={character.icon}
          name={character.name}
          className="size-12 rounded-lg bg-gradient-to-br from-element/40 to-element/8"
        />
        {element && (
          <CollectionAvatar
            record={element}
            fileName={element.icon}
            name={element.name}
            className="absolute right-0 bottom-0 size-4 rounded-full bg-card/85 p-0.5"
          />
        )}
        {props.delete && !props.disabled && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute inset-0 size-full rounded-lg bg-destructive p-2.5 text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground focus:opacity-100 group-hover/team-avatar:opacity-100 data-[state=open]:opacity-100"
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
                Yes, I really want to delete
              </Button>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className="w-full truncate text-center text-[10px] leading-tight text-muted-foreground">
        {character.name}
      </span>
    </div>
  );
}
