import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { AppContext } from '@/main';
import { router } from '@/router';
import { useAuth } from '@/stores/auth';

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

function RootComponent() {
  const auth = useAuth();

  useEffect(() => {
    router.invalidate();
  }, [auth.isAuthenticated]);

  return <Outlet />;
}
