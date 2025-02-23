import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
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

function RootComponent() {
  return <Outlet />;
}
