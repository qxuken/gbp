import { useRouter } from '@tanstack/react-router';
import {
  type AuthRecord,
  ClientResponseError,
  type RecordAuthResponse,
  type RecordModel,
} from 'pocketbase';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner';

import { pbClient } from '@/api/pocketbase';

export interface AuthContext {
  logout(): void;
  isAuthenticated: boolean;
  record: AuthRecord | null;
  passwordReset(email: string): Promise<boolean>;
  requestVerification(email: string): Promise<boolean>;
  authRefresh(): Promise<RecordAuthResponse<RecordModel>>;
  register(data: FormData): Promise<RecordAuthResponse<RecordModel>>;
  login(
    email: string,
    password: string,
  ): Promise<RecordAuthResponse<RecordModel>>;
}

export const DEFAULT_AUTH_CONTEXT = {
  authRefresh() {
    return pbClient.collection('users').authRefresh();
  },
  isAuthenticated: pbClient.authStore.isValid,
  login(email: string, password: string) {
    return pbClient.collection('users').authWithPassword(email, password);
  },

  logout() {
    pbClient.authStore.clear();
  },

  passwordReset(email: string) {
    return pbClient.collection('users').requestPasswordReset(email);
  },

  record: pbClient.authStore.record,

  register(data: FormData) {
    data.set('emailVisibility', 'true');
    return pbClient.collection('users').create(data);
  },

  requestVerification(email: string) {
    return pbClient.collection('users').requestVerification(email);
  },
} satisfies AuthContext;

export const AuthContext = createContext(DEFAULT_AUTH_CONTEXT);

export function AuthProvider({ children, ...props }: PropsWithChildren) {
  const router = useRouter();
  const [record, setRecord] = useState(pbClient.authStore.record);

  const authRefresh = async () =>
    DEFAULT_AUTH_CONTEXT.authRefresh()
      .then((res) => {
        setRecord(res.record);
        return res;
      })
      .catch((e) => {
        if (e instanceof ClientResponseError && !e.isAbort) {
          pbClient.authStore.clear();
          setRecord(null);
        }
        throw e;
      });

  const login = async (email: string, password: string) =>
    DEFAULT_AUTH_CONTEXT.login(email, password)
      .then((res) => {
        setRecord(res.record);
        return res;
      })
      .catch((e) => {
        if (e instanceof ClientResponseError && !e.isAbort) {
          setRecord(null);
        }
        throw e;
      });

  const logout = () => {
    DEFAULT_AUTH_CONTEXT.logout();
    setRecord(null);
  };

  useEffect(() => {
    if (pbClient.authStore.isValid) {
      authRefresh().catch(() => {
        toast.error('You have been unathorized');
        router.invalidate();
      });
    }
  }, []);

  const context = {
    authRefresh,
    isAuthenticated: pbClient.authStore.isValid,
    login,
    logout,
    passwordReset: DEFAULT_AUTH_CONTEXT.passwordReset,
    record,
    register: DEFAULT_AUTH_CONTEXT.register,
    requestVerification: DEFAULT_AUTH_CONTEXT.requestVerification,
  };

  return (
    <AuthContext.Provider {...props} value={context}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
