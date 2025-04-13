import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { enableMapSet } from 'immer';
import { Provider as JotaiProvider } from 'jotai/react';
import { RecordModel } from 'pocketbase';
import { RecordAuthResponse } from 'pocketbase';
import { PropsWithChildren } from 'react';
import ReactDOM from 'react-dom/client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { router } from '@/router';
import { auth as useAuth } from '@/store/auth';
import { store } from '@/store/jotai-store';

import('@/api/dictionaries/loader');

if (!import.meta.env.PROD) {
  import('@/devtoolsLoader');
}

enableMapSet();

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

function AppContext({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </QueryClientProvider>
  );
}
function App() {
  const auth = useAuth();
  const context = {
    isAuthenticated: auth.isAuthenticated,
    initCheckComplete: auth.initCheckComplete,
    authRefresh: auth.authRefresh,
  };

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
  root.render(
    <AppContext>
      <App />
    </AppContext>,
  );
}
