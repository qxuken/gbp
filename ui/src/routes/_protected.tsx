import { UserInfo } from '@/components/user-info';
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
} from '@tanstack/react-router';

export const Route = createFileRoute('/_protected')({
  component: RouteComponent,
  beforeLoad({ context, location }) {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
});

function RouteComponent() {
  return (
    <div className="p-2">
      <header className="w-full flex justify-between gap-2 text-lg">
        <Link
          to="/"
          activeProps={{
            className: 'font-bold',
          }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>
        <UserInfo />
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
