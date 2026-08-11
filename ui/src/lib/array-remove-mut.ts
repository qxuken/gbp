export function removeByPredMut<T>(
  items: T[],
  predicate: (v: T, index: number, obj: T[]) => boolean,
): void {
  const index = items.findIndex(predicate);
  if (index !== -1) {
    items.splice(index, 1);
  }
}
