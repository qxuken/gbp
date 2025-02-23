import {
  RouterProvider,
  createRouteMask,
  createRouter,
} from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import { Icons } from '@/components/icons';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { type Auth, auth, useAuth } from '@/stores/auth';
import { type Theme, theme, useTheme } from '@/stores/theme';

import { routeTree } from './routeTree.gen';

import('@/api/dictionaries-loader');

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
      <Icons.spinner />
    </div>;
  },
});

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export interface AppContext {
  auth: Auth;
  theme: Theme;
}

function App() {
  const theme = useTheme();
  const auth = useAuth();
  const context = { theme, auth };
  return (
    <>
      <TooltipProvider>
        <RouterProvider router={router} context={context} />
      </TooltipProvider>
      <Toaster position="top-center" richColors />
    </>
  );
}

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
