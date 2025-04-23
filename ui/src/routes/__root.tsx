import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

import { authStore } from '@/api/pocketbase';
import { router } from '@/router';

export const Route = createRootRouteWithContext()({
  component: RootComponent,
});

authStore.onChange(() => {
  router.invalidate();
});

function RootComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
