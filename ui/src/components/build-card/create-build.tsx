import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { newCharacterPlans as useNewCharacterPlans } from '@/stores/newCharacterPlans';

import { CharacterPicker } from './ui/character-picker';

type Props = { size: number; disabled?: boolean };
export function CreateBuild({ size, disabled }: Props) {
  const addNew = useNewCharacterPlans((s) => s.addNew);

  const createNewPlan = (characterId: string) => {
    addNew(characterId, size);
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
