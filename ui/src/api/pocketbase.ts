import Pocketbase from 'pocketbase';

export const pbClient = new Pocketbase(import.meta.env.VITE_POCKETBASE_URL);
pbClient.autoCancellation(false);

if (!import.meta.env.PROD && typeof window !== 'undefined') {
  window['pbClient'] = pbClient;
}
