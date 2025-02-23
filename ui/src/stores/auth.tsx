import {
  type AuthRecord,
  ClientResponseError,
  type RecordAuthResponse,
  type RecordModel,
} from 'pocketbase';
import { create } from 'zustand';

import { pbClient } from '@/api/pocketbase';

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
}));

export function useAuth() {
  return auth();
}

if (import.meta.env.DEV) {
  import('@/tweakpane').then(({ pane }) => {
    const group = pane.addFolder({ title: 'Auth', expanded: false });
    const params = {
      get ['store:userId']() {
        return auth.getState().record?.id ?? 'none';
      },
      get ['pbClient:userId']() {
        return pbClient.authStore.record?.id ?? 'none';
      },
      get ['store:isAuthenticated']() {
        return auth.getState().isAuthenticated;
      },
      get ['pbClient:isValid']() {
        return pbClient.authStore.isValid;
      },
      get ['pbClient:isSuperuser']() {
        return pbClient.authStore.isSuperuser;
      },
    };
    group.addBinding(params, 'store:userId', { readonly: true });
    group.addBinding(params, 'pbClient:userId', { readonly: true });
    group.addBinding(params, 'store:isAuthenticated', { readonly: true });
    group.addBinding(params, 'pbClient:isValid', { readonly: true });
    group.addBinding(params, 'pbClient:isSuperuser', { readonly: true });
    group
      .addButton({ title: 'pb logout' })
      .on('click', () => pbClient.authStore.clear());
  });
}
