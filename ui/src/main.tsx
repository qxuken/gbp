import {
  RouterProvider,
  createRouteMask,
  createRouter,
} from '@tanstack/react-router';
import { PropsWithChildren } from 'react';
import ReactDOM from 'react-dom/client';

import '@/api/dictionaries-loader';
import {
  type AuthContext,
  AuthProvider,
  DEFAULT_AUTH_CONTEXT,
  useAuth,
} from '@/auth';
import { Icons } from '@/components/icons';
import {
  THEME_PROVIDER_INITIAL_STATE,
  type ThemeContext,
  ThemeProvider,
  useTheme,
} from '@/components/theme';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routeTree } from '@/routeTree.gen';

const confirmationScreenMask = createRouteMask({
  from: '/confirm',
  routeTree,
  search: (s) => ({ redirect: 'redirect' in s ? s.redirect : '' }),
  to: '/login',
});

// Set up a Router instance
const router = createRouter({
  context: {
    auth: DEFAULT_AUTH_CONTEXT,
    theme: THEME_PROVIDER_INITIAL_STATE,
  },
  defaultPendingComponent: () => {
    <div className="p-2 text-2xl">
      <Icons.spinner />
    </div>;
  },
  defaultPreload: 'intent',
  routeMasks: [confirmationScreenMask],
  routeTree,
  scrollRestoration: true,
});

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export interface AppContext {
  auth: AuthContext;
  theme: ThemeContext;
}

function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider storageKey="gbp-ui-theme">
      <AuthProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  const theme = useTheme();
  const auth = useAuth();

  const context = { auth, theme };

  return (
    <>
      <RouterProvider router={router} context={context} />
      <Toaster position="top-center" richColors />
    </>
  );
}

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}
