import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useNewCharacterPlans } from '@/stores/newCharacterPlans';

import { CharacterPicker } from './ui/character-picker';

type Props = { size: number; disabled?: boolean };
export function CreateBuild({ size, disabled }: Props) {
  const newCharacterPlansStore = useNewCharacterPlans();

  const createNewPlan = (characterId: string) => {
    newCharacterPlansStore.addNew(characterId, size);
  };

  return (
    <CharacterPicker title="Create new build" onSelect={createNewPlan}>
      <Button disabled={disabled}>
        <Icons.New />
        <span>Create new build</span>
      </Button>
    </CharacterPicker>
  );
}
