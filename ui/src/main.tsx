import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { enableMapSet, enablePatches } from 'immer';
import { PropsWithChildren } from 'react';
import ReactDOM from 'react-dom/client';

import { DictionaryProvider } from '@/api/dictionaries/hooks';
import '@/api/dictionaries/loader';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { router } from '@/router';

import { queryClient } from './api/queryClient';

if (!import.meta.env.PROD) {
  import('@/devtoolsLoader');
}

enableMapSet();
enablePatches();

function AppContext({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <DictionaryProvider>{children}</DictionaryProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <>
      <TooltipProvider>
        <RouterProvider router={router} />
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
