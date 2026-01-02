import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import {
  ErrorComponent,
  ErrorComponentProps,
  useRouter,
} from '@tanstack/react-router';
import { useEffect } from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div>
      <ErrorComponent error={error} />
      <div className="p-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            router.invalidate();
          }}
        >
          <Icons.Retry className="size-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
