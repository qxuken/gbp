import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { authStore } from '@/api/pocketbase';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ search }) => {
    if (authStore.isValid) {
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
