import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAddNewCharacterPlan } from '@/store/plans/pendingPlans';
import { useReorderPlansIsPending } from '@/store/plans/plans';

import { CharacterPicker } from './ui/character-picker';

export function CreateBuild() {
  const addNew = useAddNewCharacterPlan();
  const reorderIsPending = useReorderPlansIsPending();

  return (
    <CharacterPicker title="Create new build" onSelect={addNew}>
      <Button disabled={reorderIsPending}>
        <Icons.New />
        <span>Create new build</span>
      </Button>
    </CharacterPicker>
  );
}
