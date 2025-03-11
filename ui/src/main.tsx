import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { type Auth, useAuth } from '@/stores/auth';
import { type Theme, useTheme } from '@/stores/theme';

import { router } from './router';

import('@/api/dictionaries-loader');

if (!import.meta.env.PROD) {
  import('@/devtoolsLoader');
}

export interface AppContext {
  auth: Auth;
  theme: Theme;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

function App() {
  const theme = useTheme();
  const auth = useAuth();
  const context = { theme, auth };

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} context={context} />
        </TooltipProvider>
      </QueryClientProvider>
      <Toaster position="top-center" richColors />
    </>
  );
}

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
