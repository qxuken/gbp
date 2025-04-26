import { useReorderPlansIsPending } from '@/api/plans/plans';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAddPendingPlans } from '@/store/plans/pendingPlans';
import { useRenderingPlanTotal } from '@/store/plans/renderingItems';

import { CharacterPicker } from './ui/character-picker';

export function CreatePlan() {
  const addNew = useAddPendingPlans();
  const total = useRenderingPlanTotal();
  const reorderIsPending = useReorderPlansIsPending();

  return (
    <CharacterPicker
      title="Create new build"
      onSelect={(charactedId) => addNew(charactedId, total)}
    >
      <Button disabled={reorderIsPending}>
        <Icons.New />
        <span>Create new build</span>
      </Button>
    </CharacterPicker>
  );
}
