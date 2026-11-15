import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import * as authApi from './api';
import { restoreSessionState } from './sessionRecovery';
import { clearStoredSessionToken, getStoredSessionToken, storeSessionToken } from './storage';
import type { AuthCredentials, AuthStatus, RegistrationInput, User } from './types';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  restoreError: string | null;
  signIn: (input: AuthCredentials) => Promise<void>;
  signUp: (input: RegistrationInput) => Promise<void>;
  signOut: () => Promise<void>;
  retryRestore: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const restoreSession = useCallback(async () => {
    setStatus('loading');
    setRestoreError(null);
    const result = await restoreSessionState({
      getToken: getStoredSessionToken,
      clearToken: clearStoredSessionToken,
      getMe: authApi.getMe,
    });
    setUser(result.user);
    setRestoreError(result.error);
    setStatus(result.status);
  }, []);

  useEffect(() => {
    // Restoring from SecureStore is the external side effect this provider owns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async (input: AuthCredentials) => {
    setError(null);
    setRestoreError(null);
    try {
      const response = await authApi.login(input);
      await storeSessionToken(response.sessionToken);
      setUser(response.user);
      setRestoreError(null);
      setStatus('authenticated');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to sign in.';
      setError(message);
      throw caught;
    }
  }, []);

  const signUp = useCallback(async (input: RegistrationInput) => {
    setError(null);
    setRestoreError(null);
    try {
      const response = await authApi.register(input);
      await storeSessionToken(response.sessionToken);
      setUser(response.user);
      setRestoreError(null);
      setStatus('authenticated');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to create your account.';
      setError(message);
      throw caught;
    }
  }, []);

  const signOut = useCallback(async () => {
    const token = await getStoredSessionToken();
    await clearStoredSessionToken();
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
    setRestoreError(null);
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        // The local session is already cleared; the server session will expire naturally.
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isLoading: status === 'loading',
      error,
      restoreError,
      signIn,
      signUp,
      signOut,
      retryRestore: restoreSession,
      clearError: () => setError(null),
    }),
    [error, restoreError, restoreSession, signIn, signOut, signUp, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
