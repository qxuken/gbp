import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import ReactDOM from 'react-dom/client';

import { queryClient } from '@/api/queryClient';
import { router } from '@/router';

function TanstackDevTools() {
  return (
    <>
      <ReactQueryDevtools buttonPosition="bottom-left" client={queryClient} />
      <TanStackRouterDevtools
        position="bottom-left"
        router={router}
        toggleButtonProps={{
          ref: (el) => {
            el.style.left = '64px';
          },
        }}
      />
    </>
  );
}

let rootElement = document.getElementById('tanstack-devtools')!;
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'tanstack-devtools';
  document.body.appendChild(rootElement);
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<TanstackDevTools />);
}
