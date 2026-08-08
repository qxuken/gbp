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
import { useEffect, useState } from 'react';

import { useCharacterPlansMutation } from '@/api/plans/character-plans';
import { usePlans } from '@/api/plans/plans';
import { PlanInfo } from '@/components/plan-card/plan-info';
import { handleReorderImmer } from '@/lib/handle-reorder';
import { Route } from '@/routes/_protected/builds';
import { useSetFilters } from '@/store/plans/filters';
import {
  MAX_ITEMS,
  useRenderingPlanItems,
  useRenderingPlanTotal,
} from '@/store/plans/rendering-items';

import { CreatePlan } from './plan-card/create-plan';
import { Card } from './ui/card';

function createDefaultFilters() {
  return {
    name: '',
    complete: false,
    elements: new Set<string>(),
    weaponTypes: new Set<string>(),
    characters: new Set<string>(),
    artifactSets: new Set<string>(),
    specialsByArtifactTypePlans: new Map<string, Set<string>>(),
  };
}

// TODO: simplify rendering flow to avoid re-renders on simple field updates
export default function Plans() {
  const plans = usePlans();
  const mutations = useCharacterPlansMutation(plans);
  const renderingItems = useRenderingPlanItems(mutations.records);
  const total = useRenderingPlanTotal();
  const navigate = Route.useNavigate();
  const deps = Route.useLoaderDeps();
  const setFilters = useSetFilters();
  const [revealId, setRevealId] = useState<string | null>(null);

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

  const handleCreate = (characterId: string) => {
    setFilters((v) => {
      const defaults = createDefaultFilters();
      v.name = defaults.name;
      v.elements = defaults.elements;
      v.weaponTypes = defaults.weaponTypes;
      v.characters = defaults.characters;
      v.artifactSets = defaults.artifactSets;
      v.specialsByArtifactTypePlans = defaults.specialsByArtifactTypePlans;
    });
    setRevealId(mutations.create(characterId));
  };

  useEffect(() => {
    if (!revealId) return;
    const perPage = deps.perPage;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    if (deps.page !== lastPage) {
      navigate({
        to: Route.to,
        resetScroll: false,
        search: (state) => ({ ...state, page: lastPage, perPage }),
      });
      return;
    }
    const el = document.getElementById(revealId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => {
      setRevealId(null);
    }, 2000);
    return () => {
      clearTimeout(t);
    };
  }, [
    revealId,
    renderingItems.length,
    deps.page,
    deps.perPage,
    total,
    navigate,
  ]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={plans} strategy={rectSortingStrategy}>
          {renderingItems.length === 0 && (
            <Card className="w-full border-2 border-dashed border-muted bg-muted/5">
              <div className="w-full h-full flex items-center justify-center p-12">
                <CreatePlan create={handleCreate} />
              </div>
            </Card>
          )}
          {renderingItems.map((item) => (
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
          ))}
        </SortableContext>
      </DndContext>
      <div className="fixed bottom-6 right-6 z-50">
        <CreatePlan
          create={handleCreate}
          round
          disabled={total >= MAX_ITEMS}
          className="shadow-lg"
        />
      </div>
    </>
  );
}
