import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { authStore } from '@/api/pocketbase';
import { Layout } from '@/components/layout';

export const Route = createFileRoute('/_protected')({
  beforeLoad() {
    if (!authStore.isValid) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Layout showUserManagement>
      <Outlet />
    </Layout>
  );
}
