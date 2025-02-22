import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

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
        <h1 className="text-2xl font-black">Genshin Build Planner</h1>
        <UserInfo />
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
