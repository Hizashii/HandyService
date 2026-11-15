import { ApiError } from './api';
import type { User } from './types';

export type SessionRecoveryStatus = 'authenticated' | 'unauthenticated' | 'recoverable-error';

export type SessionRecoveryResult = {
  status: SessionRecoveryStatus;
  user: User | null;
  error: string | null;
};

type RestoreSessionDependencies = {
  getToken: () => Promise<string | null>;
  clearToken: () => Promise<void>;
  getMe: (token: string) => Promise<{ user: User }>;
};

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : 'Unable to restore your session. Try again.';
}

export async function restoreSessionState({
  getToken,
  clearToken,
  getMe,
}: RestoreSessionDependencies): Promise<SessionRecoveryResult> {
  let token: string | null = null;

  try {
    token = await getToken();
    if (!token) {
      return { status: 'unauthenticated', user: null, error: null };
    }

    const response = await getMe(token);
    return { status: 'authenticated', user: response.user, error: null };
  } catch (caught) {
    if (token && caught instanceof ApiError && caught.status === 401) {
      try {
        await clearToken();
        return { status: 'unauthenticated', user: null, error: null };
      } catch {
        return {
          status: 'recoverable-error',
          user: null,
          error: 'Your expired session could not be cleared. Try again.',
        };
      }
    }

    return {
      status: 'recoverable-error',
      user: null,
      error: errorMessage(caught),
    };
  }
}
