import {
  type AuthRecord,
  ClientResponseError,
  type RecordAuthResponse,
  type RecordModel,
} from 'pocketbase';
import { create } from 'zustand';

import { pbClient } from '@/api/pocketbase';
import { queryClient } from '@/main';

export interface Auth {
  initCheckComplete: boolean;
  isAuthenticated: boolean;
  record: AuthRecord | null;
  authRefresh(): Promise<RecordAuthResponse<RecordModel>>;
  login(
    email: string,
    password: string,
  ): Promise<RecordAuthResponse<RecordModel>>;
  logout(): void;
  passwordReset(email: string): Promise<boolean>;
  register(data: FormData): Promise<RecordAuthResponse<RecordModel>>;
  requestVerification(email: string): Promise<boolean>;
  updateProfile(data: FormData): Promise<AuthRecord>;
  updateEmail(newEmail: string): Promise<boolean>;
  updatePassword(
    oldPassword: string,
    password: string,
    passwordConfirm: string,
  ): Promise<AuthRecord>;
}

export const auth = create<Auth>((set) => ({
  initCheckComplete: !pbClient.authStore.isValid,
  isAuthenticated: pbClient.authStore.isValid,
  record: pbClient.authStore.record,

  async authRefresh() {
    try {
      const res = await pbClient.collection('users').authRefresh();
      set({
        initCheckComplete: true,
        isAuthenticated: pbClient.authStore.isValid,
        record: res.record,
      });
      return res;
    } catch (e) {
      if (e instanceof ClientResponseError && !e.isAbort) {
        pbClient.authStore.clear();
        set({
          initCheckComplete: true,
          isAuthenticated: false,
          record: null,
        });
      }
      throw e;
    }
  },

  async login(email: string, password: string) {
    try {
      const res = await pbClient
        .collection('users')
        .authWithPassword(email, password);
      queryClient.clear();
      set({
        isAuthenticated: pbClient.authStore.isValid,
        record: res.record,
      });
      return res;
    } catch (e) {
      if (e instanceof ClientResponseError && !e.isAbort) {
        set({
          isAuthenticated: false,
          record: null,
        });
      }
      throw e;
    }
  },

  logout() {
    pbClient.authStore.clear();
    set({
      isAuthenticated: false,
      record: null,
    });
  },

  passwordReset(email: string) {
    return pbClient.collection('users').requestPasswordReset(email);
  },

  register(data: FormData) {
    data.set('emailVisibility', 'true');
    return pbClient.collection('users').create(data);
  },

  requestVerification(email: string) {
    return pbClient.collection('users').requestVerification(email);
  },

  async updateProfile(data: FormData) {
    if (!pbClient.authStore.record?.id) {
      throw new Error('Not authenticated');
    }
    const record = await pbClient
      .collection('users')
      .update(pbClient.authStore.record.id, data);
    set({ record });
    return record;
  },

  async updateEmail(newEmail: string) {
    return pbClient.collection('users').requestEmailChange(newEmail);
  },

  async updatePassword(
    oldPassword: string,
    password: string,
    passwordConfirm: string,
  ) {
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
    set({ record });
    return record;
  },
}));
