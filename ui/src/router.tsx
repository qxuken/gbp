import { createRouteMask, createRouter } from '@tanstack/react-router';

import { Icons } from '@/components/icons';
import { auth } from '@/store/auth';

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
    isAuthenticated: auth.getState().isAuthenticated,
    initCheckComplete: auth.getState().initCheckComplete,
    authRefresh: auth.getState().authRefresh,
  },
  defaultPendingComponent: () => {
    <div className="w-full p-2 flex justify-center">
      <Icons.Spinner className="animate-spin size-12" />
    </div>;
  },
});

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
