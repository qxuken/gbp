import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { CharacterPicker } from './ui/character-picker';

type Props = {
  create(characterId: string): void;
  disabled?: boolean;
  className?: string;
  round?: boolean;
};
export function CreatePlan(props: Props) {
  return (
    <CharacterPicker title="Create new build" onSelect={props.create}>
      <Button
        disabled={props.disabled}
        className={cn('gap-2', props.className, {
          'size-16 rounded-full p-0 [&_span]:hidden': props.round,
        })}
      >
        {props.round ? <Icons.Add /> : <Icons.New />}
        <span>Create new build</span>
      </Button>
    </CharacterPicker>
  );
}
