import { ClientResponseError } from 'pocketbase';
import { toast } from 'sonner';

export function notifyWithRetry<T = void>(
  retryAction: (v: T) => void | Promise<void>,
  onAutoClose?: () => void | Promise<void>,
) {
  return function(error: Error, v: T): void {
    if (error instanceof ClientResponseError && error.isAbort) return;
    const errorText = error.message;
    const description = (
      <div className="grid gap-1">
        {errorText.length > 0 && <span>{errorText}</span>}
        <span className="text-muted-foreground text-xs">
          Consider reloading page if error persists
        </span>
      </div>
    );
    toast.error('Sync error', {
      description,
      action: {
        label: 'Retry',
        onClick: () => retryAction(v),
      },
      onAutoClose,
    });
  };
}
