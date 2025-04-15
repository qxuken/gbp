import Pocketbase, { LocalAuthStore } from 'pocketbase';

const AUTH_STORE_KEY = 'pbAuth';
export const authStore = new LocalAuthStore(AUTH_STORE_KEY);

export const pbClient = new Pocketbase(
  import.meta.env.VITE_POCKETBASE_URL,
  authStore,
);
pbClient.autoCancellation(false);

if (!import.meta.env.PROD && typeof window !== 'undefined') {
  window['pbClient'] = pbClient;
}
