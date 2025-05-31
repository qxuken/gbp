import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod/v4-mini';

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
    redirect: z.catch(z.optional(z.string()), ''),
  }),
});

function AuthLayout() {
  return (
    <Layout showLoginButton>
      <Outlet />
    </Layout>
  );
}
