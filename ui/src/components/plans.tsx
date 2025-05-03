import {
  closestCorners,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import { useCharacterPlansMutation } from '@/api/plans/character-plans';
import { usePlans } from '@/api/plans/plans';
import { PlanInfo } from '@/components/plan-card/plan-info';
import { handleReorderImmer } from '@/lib/handle-reorder';
import { useRenderingPlanItems } from '@/store/plans/rendering-items';

import { CreatePlan } from './plan-card/create-plan';
import { Card } from './ui/card';

// TODO: simplify rendering flow to avoid re-renders on simple field updates
export default function Plans() {
  const plans = usePlans();
  const mutations = useCharacterPlansMutation(plans);
  const renderingItems = useRenderingPlanItems(mutations.records);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function handleDragEnd(event: DragEndEvent) {
    handleReorderImmer(event, plans, mutations.update);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={plans} strategy={rectSortingStrategy}>
        {renderingItems.map((item) => {
          switch (item.type) {
            case 'plan': {
              return (
                <PlanInfo
                  key={item.plan.id}
                  plan={item.plan}
                  character={item.character}
                  update={(cb) => mutations.update(item.plan, cb)}
                  retry={mutations.retry}
                  delete={() => mutations.delete(item.plan.id)}
                  isLoading={item.plan.isOptimistic}
                  isError={item.plan.isOptimisticError}
                  disabled={item.plan.isOptimisticBlocked}
                />
              );
            }
            case 'create':
              return (
                <Card
                  key="create"
                  className="w-full border-2 border-dashed border-muted bg-muted/5"
                >
                  <div className="w-full h-full flex items-center justify-center p-12">
                    <CreatePlan create={mutations.create} />
                  </div>
                </Card>
              );
          }
        })}
      </SortableContext>
    </DndContext>
  );
}
