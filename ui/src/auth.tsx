import {
  ClientResponseError,
  type AuthRecord,
  type RecordAuthResponse,
  type RecordModel,
} from 'pocketbase';
import { pbClient } from './api/pocketbase';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner';

export interface AuthContext {
  record: AuthRecord | null;
  isAuthenticated: boolean;
  authRefresh(): Promise<RecordAuthResponse<RecordModel>>;
  login(
    email: string,
    password: string,
  ): Promise<RecordAuthResponse<RecordModel>>;
  passwordReset(email: string): Promise<boolean>;
  register(data: FormData): Promise<RecordAuthResponse<RecordModel>>;
  requestVerification(email: string): Promise<boolean>;
  logout(): void;
}

export const DEFAULT_AUTH_CONTEXT = {
  record: pbClient.authStore.record,
  isAuthenticated: pbClient.authStore.isValid,
  authRefresh() {
    return pbClient.collection('users').authRefresh();
  },

  passwordReset(email: string) {
    return pbClient.collection('users').requestPasswordReset(email);
  },

  login(email: string, password: string) {
    return pbClient.collection('users').authWithPassword(email, password);
  },

  register(data: FormData) {
    data.set('emailVisibility', 'true');
    return pbClient.collection('users').create(data);
  },

  requestVerification(email: string) {
    return pbClient.collection('users').requestVerification(email);
  },

  logout() {
    pbClient.authStore.clear();
  },
} satisfies AuthContext;

export const AuthContext = createContext(DEFAULT_AUTH_CONTEXT);

export function AuthProvider({ children, ...props }: PropsWithChildren) {
  const [record, setRecord] = useState(pbClient.authStore.record);

  const authRefresh = async () =>
    DEFAULT_AUTH_CONTEXT.authRefresh()
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
      });
    }
  }, []);

  const context = {
    isAuthenticated: pbClient.authStore.isValid,
    record,
    authRefresh,
    login,
    logout,
    register: DEFAULT_AUTH_CONTEXT.register,
    requestVerification: DEFAULT_AUTH_CONTEXT.requestVerification,
    passwordReset: DEFAULT_AUTH_CONTEXT.passwordReset,
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
