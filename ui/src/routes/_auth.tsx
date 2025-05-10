import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { authStore } from '@/api/pocketbase';
import { Layout } from '@/components/layout';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ search }) => {
    if (authStore.isValid) {
      throw redirect({ to: search.redirect || '/builds' });
    }
  },
  component: AuthLayout,
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
  }),
});

function AuthLayout() {
  return (
    <Layout showLoginButton>
      <Outlet />
    </Layout>
  );
}
