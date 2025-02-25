import { Tooltip } from '@radix-ui/react-tooltip';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserInfo } from '@/components/user-info';

export const Route = createFileRoute('/_protected')({
  beforeLoad({ context, location }) {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        search: {
          redirect: location.href,
        },
        to: '/login',
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-2">
      <header className="w-full flex justify-between gap-2 text-lg">
        <Tooltip>
          <TooltipTrigger>
            <h1 className="text-xl font-medium">GBP</h1>
          </TooltipTrigger>
          <TooltipContent>
            <p>Genshin build planner</p>
          </TooltipContent>
        </Tooltip>
        <UserInfo />
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
