import { useReorderPlansIsPending } from '@/api/plans/plans';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAddPendingPlans } from '@/store/plans/pending-plans';
import { useRenderingPlanLastOrder } from '@/store/plans/rendering-items';

import { CharacterPicker } from './ui/character-picker';

export function CreatePlan() {
  const addNew = useAddPendingPlans();
  const lastOrder = useRenderingPlanLastOrder();
  const reorderIsPending = useReorderPlansIsPending();

  return (
    <CharacterPicker
      title="Create new build"
      onSelect={(charactedId) => addNew(charactedId, lastOrder + 1)}
    >
      <Button disabled={reorderIsPending}>
        <Icons.New />
        <span>Create new build</span>
      </Button>
    </CharacterPicker>
  );
}
