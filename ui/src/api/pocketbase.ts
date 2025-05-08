import Pocketbase, { LocalAuthStore, ClientResponseError } from 'pocketbase';
import { toast } from 'sonner';

const AUTH_STORE_KEY = 'dbp__auth';
export const authStore = new LocalAuthStore(AUTH_STORE_KEY);

export const pbClient = new Pocketbase(
  import.meta.env.VITE_POCKETBASE_URL,
  authStore,
);
pbClient.autoCancellation(false);

if (!import.meta.env.PROD && typeof window !== 'undefined') {
  window['pbClient'] = pbClient;
}

if (authStore.isValid) {
  authRefresh().catch(() => {
    toast.error('You have been unauthorized');
  });
}

export async function authRefresh() {
  try {
    return await pbClient.collection('users').authRefresh();
  } catch (e) {
    if (e instanceof ClientResponseError && !e.isAbort) {
      pbClient.authStore.clear();
    }
    throw e;
  }
}

export function login(email: string, password: string) {
  return pbClient.collection('users').authWithPassword(email, password);
}

export function logout() {
  pbClient.authStore.clear();
}

export function passwordReset(email: string) {
  return pbClient.collection('users').requestPasswordReset(email);
}

export function register(data: FormData) {
  data.set('emailVisibility', 'true');
  return pbClient.collection('users').create(data);
}

export function requestVerification(email: string) {
  return pbClient.collection('users').requestVerification(email);
}

export function updateProfile(data: FormData) {
  const user = authStore.record;
  if (!user?.id) {
    throw new Error('Not authenticated');
  }
  return pbClient.collection('users').update(user.id, data);
}

export function updateEmail(newEmail: string) {
  return pbClient.collection('users').requestEmailChange(newEmail);
}

export function updatePassword(
  oldPassword: string,
  password: string,
  passwordConfirm: string,
) {
  const user = authStore.record;
  if (!user?.id) {
    throw new Error('Not authenticated');
  }
  return pbClient.collection('users').update(user.id, {
    oldPassword,
    password,
    passwordConfirm,
  });
}
