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

import { usePlans, useReorderPlans } from '@/api/plans/plans';
import { PlanInfo } from '@/components/plan-card/plan-info';
import { handleReorder } from '@/lib/handle-reorder';
import { useRenderingPlanItems } from '@/store/plans/rendering-items';

import { CreatePlan } from './plan-card/create-plan';
import { PendingPlanPlaceholder } from './plan-card/pending-plan-info';
import { Card } from './ui/card';

export default function Plans() {
  const reorderItems = useReorderPlans();
  const plans = usePlans();
  const renderingItems = useRenderingPlanItems();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function handleDragEnd(event: DragEndEvent) {
    handleReorder(event, plans, reorderItems);
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
            case 'committed': {
              return (
                <PlanInfo
                  key={item.plan.id}
                  plan={item.plan}
                  character={item.character}
                />
              );
            }
            case 'pending': {
              return (
                <PendingPlanPlaceholder
                  key={item.plan.id}
                  plan={item.plan}
                  character={item.character}
                  visible={item.visible}
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
                    <CreatePlan />
                  </div>
                </Card>
              );
          }
        })}
      </SortableContext>
    </DndContext>
  );
}
