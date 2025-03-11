import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { pbClient } from '@/api/pocketbase';
import { OnlyId, WithOrder } from '@/api/types';
import { BuildInfo } from '@/components/build-card/build-info';
import { CreateBuild } from '@/components/build-card/create-build';
import { PendingBuildInfo } from '@/components/build-card/pending-build-info';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { queryClient } from '@/main';
import { useNewCharacterPlans } from '@/stores/newCharacterPlans';

type Item = WithOrder<OnlyId>;

const QUERY_KEY = ['characterPlans'];

export const Route = createFileRoute('/_protected/')({
  component: HomeComponent,
  validateSearch: z.object({
    page: z.number().optional(),
    perPage: z.number().optional(),
  }),
  loaderDeps: ({ search: { page = 1, perPage = 20 } }) =>
    queryOptions({
      queryKey: QUERY_KEY,
      queryFn: () =>
        pbClient
          .collection<Item>('characterPlans')
          .getList(page, perPage, { fields: 'id, order', sort: 'order' }),
    }),
  loader: ({ deps }) => queryClient.ensureQueryData(deps),
});

function HomeComponent() {
  const query = Route.useLoaderDeps();
  const { data: queryData } = useSuspenseQuery(query);
  const { characterPlans } = useNewCharacterPlans();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    variables,
    mutate: reorderItems,
    isPending: reorderIsPending,
    reset,
  } = useMutation({
    mutationFn(items: Item[]) {
      const batch = pbClient.createBatch();
      for (const it of items) {
        batch
          .collection('characterPlans')
          .update(it.id, { order: it.order }, { fields: 'id, order' });
      }
      return batch.send();
    },
    onSuccess: async (data) => {
      const items = data.map((it) => it.body);
      await queryClient.setQueryData(QUERY_KEY, { ...queryData, items });
      reset();
    },
    onError: notifyWithRetry((v) => {
      reorderItems(v);
    }),
  });

  const items = variables || queryData.items;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((it) => it.id === active.id)!;
      const newIndex = items.findIndex((it) => it.id === over.id)!;
      reorderItems(
        arrayMove(items, oldIndex, newIndex).map((it, i) => ({
          id: it.id,
          order: i + 1,
        })),
      );
    }
  }

  return (
    <div className="p-2 grid grid-cols-[repeat(auto-fill,_minmax(24rem,_1fr))] gap-4 justify-center items-start">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          {items.map((build) => (
            <BuildInfo
              key={build.id}
              buildId={build.id}
              reorderIsPending={reorderIsPending}
            />
          ))}
        </SortableContext>
      </DndContext>
      {characterPlans.map((pending) => (
        <PendingBuildInfo key={pending.id} characterId={pending.characterId} />
      ))}
      <CreateBuild size={items.length} disabled={reorderIsPending} />
    </div>
  );
}
