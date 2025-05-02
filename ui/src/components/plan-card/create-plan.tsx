import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

import { CharacterPicker } from './ui/character-picker';

type Props = {
  create(characterId: string): void;
  disabled?: boolean;
};
export function CreatePlan(props: Props) {
  return (
    <CharacterPicker title="Create new build" onSelect={props.create}>
      <Button disabled={props.disabled}>
        <Icons.New />
        <span>Create new build</span>
      </Button>
    </CharacterPicker>
  );
}
