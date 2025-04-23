import { type AuthRecord } from 'pocketbase';
import { create } from 'zustand';

import { authStore } from '@/api/pocketbase';

export const useUser = create<AuthRecord | null>(() => authStore.record);

authStore.onChange(() => {
  useUser.setState(authStore.record);
});

export function useUserInvariant() {
  const user = useUser();
  if (!user) {
    throw new Error('User was expected but got null');
  }
  return user;
}
