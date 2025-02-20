import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouteMask, createRouter, redirect } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { Icons } from '@/components/icons';
import {
  type AuthContext,
  AuthProvider,
  DEFAULT_AUTH_CONTEXT,
  useAuth,
} from '@/auth';
import {
  THEME_PROVIDER_INITIAL_STATE,
  type ThemeContext,
  ThemeProvider,
  useTheme,
} from '@/components/theme';
import { PropsWithChildren } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';

const confirmationScreenMask = createRouteMask({
  routeTree,
  from: '/confirm',
  to: '/login',
  search: (s) => ({ redirect: 'redirect' in s ? s.redirect : '' }),
})

// Set up a Router instance
const router = createRouter({
  routeTree,
  routeMasks: [confirmationScreenMask],
  defaultPreload: 'intent',
  defaultPendingComponent: () => {
    <div className="p-2 text-2xl">
      <Icons.spinner />
    </div>;
  },
  scrollRestoration: true,
  context: {
    auth: DEFAULT_AUTH_CONTEXT,
    theme: THEME_PROVIDER_INITIAL_STATE,
  },
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
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  const theme = useTheme();
  const auth = useAuth();

  const context = { theme, auth };

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
