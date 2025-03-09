import { createRouteMask, createRouter } from '@tanstack/react-router';

import { Icons } from '@/components/icons';
import { auth } from '@/stores/auth';
import { theme } from '@/stores/theme';

import { routeTree } from './routeTree.gen';

const confirmationScreenMask = createRouteMask({
  from: '/confirm',
  routeTree,
  search: (s) => ({ redirect: 'redirect' in s ? s.redirect : '' }),
  to: '/login',
});

export const router = createRouter({
  routeTree,
  routeMasks: [confirmationScreenMask],
  defaultPreload: 'intent',
  scrollRestoration: true,
  context: {
    auth: auth.getState(),
    theme: theme.getState(),
  },
  defaultPendingComponent: () => {
    <div className="p-2 text-2xl">
      <Icons.Spinner />
    </div>;
  },
});

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
