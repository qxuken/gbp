import { useSyncExternalStore } from 'react';

const isCanHoverQuery = window.matchMedia('(hover: hover)');

export function useIsCanHoverQuery() {
  return useSyncExternalStore(
    (cb) => {
      isCanHoverQuery.addEventListener('change', cb);
      return () => {
        isCanHoverQuery.removeEventListener('change', cb);
      };
    },
    () => isCanHoverQuery.matches,
  );
}
