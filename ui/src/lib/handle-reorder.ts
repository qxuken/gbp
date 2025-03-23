import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

type ReorderableItem = {
  id: string;
  order: number;
};

export function handleReorder<T extends ReorderableItem>(
  event: DragEndEvent,
  items: T[],
  onReorder: (items: T[]) => void,
) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = items.findIndex((it) => it.id === active.id);
  const newIndex = items.findIndex((it) => it.id === over.id);

  if (oldIndex < 0 || newIndex < 0) {
    console.error('Invalid drag indices:', {
      oldIndex,
      newIndex,
      active,
      over,
    });
    return;
  }

  onReorder(
    arrayMove(items, oldIndex, newIndex).map((it, i) => ({
      ...it,
      order: i + 1,
    })),
  );
}
