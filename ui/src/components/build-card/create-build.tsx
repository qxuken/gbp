import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNewCharacterPlans } from '@/stores/newCharacterPlans';

import { CharacterPicker } from './ui/character-picker';

type Props = { size: number; disabled?: boolean };
export function CreateBuild({ size, disabled }: Props) {
  const newCharacterPlansStore = useNewCharacterPlans();

  const createNewPlan = (characterId: string) => {
    newCharacterPlansStore.addNew(characterId, size);
  };

  return (
    <Card className="w-full opacity-80 self-start">
      <CardContent className="size-full p-0">
        <CharacterPicker title="Create new build" onSelect={createNewPlan}>
          <Button
            className="size-full p-4"
            size="icon"
            variant="ghost"
            disabled={disabled}
          >
            <Icons.New />
            <span>Create new build</span>
          </Button>
        </CharacterPicker>
      </CardContent>
    </Card>
  );
}
