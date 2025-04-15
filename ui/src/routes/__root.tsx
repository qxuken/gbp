import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { AppContext } from '@/main';
import { router } from '@/router';
import { useIsAuthenticated } from '@/store/auth';

export const Route = createRootRouteWithContext<AppContext>()({
  component: RootComponent,
  beforeLoad(ctx) {
    if (ctx.context.isAuthenticated && !ctx.context.initCheckComplete) {
      ctx.context.authRefresh().catch(() => {
        toast.error('You have been unauthorized');
      });
    }
  },
});

function RootComponent() {
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    router.invalidate();
  }, [isAuthenticated]);

  return (
    <>
      <Outlet />
    </>
  );
}
