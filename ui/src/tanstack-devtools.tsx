import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export function TanstackDevTools() {
  return (
    <>
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools
        position="bottom-left"
        toggleButtonProps={{ style: { left: 64 } }}
      />
    </>
  );
}
