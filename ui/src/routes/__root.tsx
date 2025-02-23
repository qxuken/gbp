import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { lazy, Suspense, useState } from 'react';
import { toast } from 'sonner';

import { AppContext } from '@/main';

export const Route = createRootRouteWithContext<AppContext>()({
  component: RootComponent,
  beforeLoad(ctx) {
    if (
      ctx.context.auth.isAuthenticated &&
      !ctx.context.auth.initCheckComplete
    ) {
      ctx.context.auth.authRefresh().catch(() => {
        toast.error('You have been unathorized');
      });
    }
  },
});

const DevTools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
    import('@/tanstack-devtools').then(({ TanstackDevTools: DevTools }) => ({
      default: DevTools,
    })),
  );

function RootComponent() {
  return (
    <>
      <Outlet />
      <Suspense>
        <DevTools />
      </Suspense>
    </>
  );
}
