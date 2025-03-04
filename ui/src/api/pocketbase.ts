import Pocketbase from 'pocketbase';

export const pbClient = new Pocketbase(import.meta.env.VITE_POCKETBASE_URL);
pbClient.autoCancellation(false);

window.pbClient = pbClient;
