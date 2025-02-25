import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNewCharacterPlans } from '@/stores/newCharacterPlans';

import { CharacterPicker } from './ui/character-picker';

export function CreateBuild() {
  const newCharacterPlansStore = useNewCharacterPlans();

  const createNewPlan = (characterId: string) => {
    newCharacterPlansStore.addNew(characterId);
  };

  return (
    <Card className="w-2xl opacity-80">
      <CardContent className="size-full p-0">
        <CharacterPicker title="Create new build" onSelect={createNewPlan}>
          <Button className="size-full p-4" size="icon" variant="ghost">
            <Icons.new />
            <span>Create new build</span>
          </Button>
        </CharacterPicker>
      </CardContent>
    </Card>
  );
}
