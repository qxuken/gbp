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

import { BuildInfo } from '@/components/build-card/build-info';
import { handleReorder } from '@/lib/handle-reorder';
import { usePlans, useReorderPlans } from '@/store/plans/plans';
import { useRenderingPlanItems } from '@/store/plans/renderingItems';

import { CreateBuild } from './build-card/create-build';
import { PendingBuildInfo } from './build-card/pending-build-info';
import { Card } from './ui/card';

type Props = {
  page: number;
  perPage: number;
};
export function Builds({ page, perPage }: Props) {
  const reorderItems = useReorderPlans();
  const plans = usePlans();
  const renderingItems = useRenderingPlanItems();

  const paginatedItems = renderingItems.slice(
    perPage * (page - 1),
    perPage * page,
  );

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
        {paginatedItems.map((item) => {
          switch (item.type) {
            case 'build': {
              const { build } = item;
              return (
                <BuildInfo
                  key={build.id}
                  buildId={build.id}
                  characterId={build.character}
                />
              );
            }
            case 'pending': {
              const { pending } = item;
              return <PendingBuildInfo key={pending.id} pending={pending} />;
            }
            case 'create':
              return (
                <Card
                  key="create"
                  className="w-full border-2 border-dashed border-muted bg-muted/5"
                >
                  <div className="w-full h-full flex items-center justify-center p-12">
                    <CreateBuild />
                  </div>
                </Card>
              );
          }
        })}
      </SortableContext>
    </DndContext>
  );
}

export default Builds;
