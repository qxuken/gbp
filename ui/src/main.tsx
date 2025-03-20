import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { RecordModel } from 'pocketbase';
import { RecordAuthResponse } from 'pocketbase';
import ReactDOM from 'react-dom/client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { auth as useAuth } from '@/stores/auth';

import { router } from './router';

import('@/api/dictionaries-loader');

if (!import.meta.env.PROD) {
  import('@/devtoolsLoader');
}

export interface AppContext {
  isAuthenticated: boolean;
  initCheckComplete: boolean;
  authRefresh: () => Promise<RecordAuthResponse<RecordModel>>;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

function App() {
  const auth = useAuth();
  const context = {
    isAuthenticated: auth.isAuthenticated,
    initCheckComplete: auth.initCheckComplete,
    authRefresh: auth.authRefresh,
  };

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
  root.render(<App />);
}
