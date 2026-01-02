import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { WritableDraft } from 'immer';
import { startTransition } from 'react';

import { logger } from '@/store/logger';

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
    logger.error('Invalid drag indices:', {
      oldIndex,
      newIndex,
      active,
      over,
    });
    return;
  }

  startTransition(() =>
    onReorder(
      arrayMove(items, oldIndex, newIndex).map((it, i) => ({
        ...it,
        order: i + 1,
      })),
    ),
  );
}

export function handleReorderImmer<T extends ReorderableItem>(
  event: DragEndEvent,
  items: T[],
  update: (v: T, cb: (v: WritableDraft<T>) => void) => void,
) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = items.findIndex((it) => it.id === active.id);
  const newIndex = items.findIndex((it) => it.id === over.id);

  if (oldIndex < 0 || newIndex < 0) {
    logger.error('Invalid drag indices:', {
      oldIndex,
      newIndex,
      active,
      over,
    });
    return;
  }

  startTransition(() => {
    arrayMove(items, oldIndex, newIndex).forEach((v, i) =>
      update(v, (draft) => {
        draft.order = i + 1;
      }),
    );
  });
}
