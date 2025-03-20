import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, search }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: search.redirect || '/' });
    }
  },
  component: AuthLayout,
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
  }),
});

function AuthLayout() {
  return (
    <div className="p-2 h-full">
      <Outlet />
    </div>
  );
}
