import { toast } from 'sonner';

import DictionaryLoaderWorker from './loader.worker?worker';

export const worker = new DictionaryLoaderWorker();

export function loadDictionaries() {
  worker.postMessage({ action: 'loadDictionaries' });
}

export function reloadDictionaries() {
  worker.postMessage({ action: 'reloadDictionaries' });
}

worker.addEventListener('message', (e) => {
  if (e.data.action == 'notify-error') {
    toast.error(e.data.message, {
      description: 'consider reloading page',
      action: {
        label: 'Reload',
        onClick() {
          window.location.reload();
        },
      },
    });
    console.error(e.data.error);
  }
});
