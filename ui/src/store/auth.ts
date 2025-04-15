import { atom, useAtomValue, useSetAtom } from 'jotai';
import { queryClientAtom } from 'jotai-tanstack-query';
import {
  type AuthRecord,
  ClientResponseError,
  type RecordAuthResponse,
  type RecordModel,
} from 'pocketbase';

import { authStore, pbClient } from '@/api/pocketbase';
import { queryClient } from '@/main';

import { store } from './jotai-store';
import { pendingCharacterPlansMapAtom } from './plans/pendingPlans';

export const initCheckCompleteAtom = atom(!authStore.isValid);
export const isAuthenticatedAtom = atom(authStore.isValid);
export const recordAtom = atom<AuthRecord | null>(authStore.record);

authStore.onChange(() => {
  store.set(isAuthenticatedAtom, authStore.isValid);
  store.set(recordAtom, authStore.record);
});

export const authRefreshAtom = atom(
  null,
  async (_get, set): Promise<RecordAuthResponse<RecordModel>> => {
    try {
      const res = await pbClient.collection('users').authRefresh();
      set(isAuthenticatedAtom, authStore.isValid);
      set(recordAtom, res.record);
      return res;
    } catch (e) {
      if (e instanceof ClientResponseError && !e.isAbort) {
        pbClient.authStore.clear();
        set(isAuthenticatedAtom, false);
        set(recordAtom, null);
      }
      throw e;
    } finally {
      set(initCheckCompleteAtom, true);
    }
  },
);

const loginAtom = atom(
  null,
  async (
    get,
    set,
    email: string,
    password: string,
  ): Promise<RecordAuthResponse<RecordModel>> => {
    try {
      const res = await pbClient
        .collection('users')
        .authWithPassword(email, password);
      set(pendingCharacterPlansMapAtom, (plans) => plans.clear());
      set(isAuthenticatedAtom, pbClient.authStore.isValid);
      set(recordAtom, res.record);
      get(queryClientAtom).clear();
      return res;
    } catch (e) {
      if (e instanceof ClientResponseError && !e.isAbort) {
        set(isAuthenticatedAtom, false);
        set(recordAtom, null);
      }
      throw e;
    }
  },
);

const logoutAtom = atom(null, (_get, set): void => {
  pbClient.authStore.clear();
  set(isAuthenticatedAtom, false);
  set(recordAtom, null);
});

const passwordResetAtom = atom(
  null,
  async (_get, _set, email: string): Promise<boolean> => {
    return pbClient.collection('users').requestPasswordReset(email);
  },
);

const registerAtom = atom(
  null,
  async (
    _get,
    _set,
    data: FormData,
  ): Promise<RecordAuthResponse<RecordModel>> => {
    data.set('emailVisibility', 'true');
    return pbClient.collection('users').create(data);
  },
);

const requestVerificationAtom = atom(
  null,
  async (_get, _set, email: string): Promise<boolean> => {
    return pbClient.collection('users').requestVerification(email);
  },
);

const updateProfileAtom = atom(
  null,
  async (_get, set, data: FormData): Promise<AuthRecord> => {
    if (!pbClient.authStore.record?.id) {
      throw new Error('Not authenticated');
    }
    const record = await pbClient
      .collection('users')
      .update(pbClient.authStore.record.id, data);
    set(recordAtom, record);
    return record;
  },
);

const updateEmailAtom = atom(
  null,
  async (_get, _set, newEmail: string): Promise<boolean> => {
    return pbClient.collection('users').requestEmailChange(newEmail);
  },
);

const updatePasswordAtom = atom(
  null,
  async (
    _get,
    set,
    oldPassword: string,
    password: string,
    passwordConfirm: string,
  ): Promise<AuthRecord> => {
    if (!pbClient.authStore.record?.id) {
      throw new Error('Not authenticated');
    }
    const record = await pbClient
      .collection('users')
      .update(pbClient.authStore.record.id, {
        oldPassword,
        password,
        passwordConfirm,
      });
    set(recordAtom, record);
    return record;
  },
);

// Custom hooks for state (read-only)
export function useInitCheckComplete() {
  return useAtomValue(initCheckCompleteAtom);
}

export function useIsAuthenticated() {
  return useAtomValue(isAuthenticatedAtom);
}

export function useRecord() {
  return useAtomValue(recordAtom);
}

// Custom hooks for actions
export function useAuthRefresh() {
  return useSetAtom(authRefreshAtom);
}

export function useLogin() {
  return useSetAtom(loginAtom);
}

export function useLogout() {
  return useSetAtom(logoutAtom);
}

export function usePasswordReset() {
  return useSetAtom(passwordResetAtom);
}

export function useRegister() {
  return useSetAtom(registerAtom);
}

export function useRequestVerification() {
  return useSetAtom(requestVerificationAtom);
}

export function useUpdateProfile() {
  return useSetAtom(updateProfileAtom);
}

export function useUpdateEmail() {
  return useSetAtom(updateEmailAtom);
}

export function useUpdatePassword() {
  return useSetAtom(updatePasswordAtom);
}

// Helper functions for non-hook contexts
export async function authRefresh() {
  try {
    const res = await pbClient.collection('users').authRefresh();
    return res;
  } catch (e) {
    if (e instanceof ClientResponseError && !e.isAbort) {
      pbClient.authStore.clear();
    }
    throw e;
  }
}

export async function login(email: string, password: string) {
  const res = await pbClient
    .collection('users')
    .authWithPassword(email, password);
  queryClient.clear();
  return res;
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
  if (!pbClient.authStore.record?.id) {
    throw new Error('Not authenticated');
  }
  return pbClient
    .collection('users')
    .update(pbClient.authStore.record.id, data);
}

export function updateEmail(newEmail: string) {
  return pbClient.collection('users').requestEmailChange(newEmail);
}

export function updatePassword(
  oldPassword: string,
  password: string,
  passwordConfirm: string,
) {
  if (!pbClient.authStore.record?.id) {
    throw new Error('Not authenticated');
  }
  return pbClient.collection('users').update(pbClient.authStore.record.id, {
    oldPassword,
    password,
    passwordConfirm,
  });
}
