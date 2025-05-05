import { useSyncExternalStore } from 'react';

const isDesktopQuery = window.matchMedia('(min-width: 1024px)');

export function useIsDesktopQuery() {
  return useSyncExternalStore(
    (cb) => {
      isDesktopQuery.addEventListener('change', cb);
      return () => {
        isDesktopQuery.removeEventListener('change', cb);
      };
    },
    () => isDesktopQuery.matches,
  );
}
