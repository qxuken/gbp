import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_auth')({
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || '/' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="p-2 h-full">
      <Outlet />
    </div>
  );
}
