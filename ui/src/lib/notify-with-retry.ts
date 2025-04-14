import { ClientResponseError } from 'pocketbase';
import { toast } from 'sonner';

export function notifyWithRetry<T = void>(
  retryAction: (v: T) => void | Promise<void>,
  onAutoClose?: () => void | Promise<void>,
) {
  return function (error: Error, v: T): void {
    if (error instanceof ClientResponseError && !error.isAbort) {
      toast.error(error.message, {
        action: {
          label: 'Retry',
          onClick: () => retryAction(v),
        },
        dismissible: false,
        onAutoClose,
      });
    }
  };
}
