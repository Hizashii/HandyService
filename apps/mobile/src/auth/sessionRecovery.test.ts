import { describe, expect, it } from 'vitest';

import { ApiError } from './api';
import { restoreSessionState } from './sessionRecovery';
import type { User } from './types';

const user: User = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'customer',
  created_at: 1,
  updated_at: 1,
};

describe('restoreSessionState', () => {
  it('keeps the token after a transient outage and succeeds on retry', async () => {
    let attempts = 0;
    let cleared = false;

    const dependencies = {
      getToken: async () => 'session-token',
      clearToken: async () => {
        cleared = true;
      },
      getMe: async () => {
        attempts += 1;
        if (attempts === 1) throw new ApiError('Unable to reach HelpDK. Check your connection.', 0);
        return { user };
      },
    };

    await expect(restoreSessionState(dependencies)).resolves.toMatchObject({
      status: 'recoverable-error',
      error: 'Unable to reach HelpDK. Check your connection.',
    });
    expect(cleared).toBe(false);

    await expect(restoreSessionState(dependencies)).resolves.toEqual({
      status: 'authenticated',
      user,
      error: null,
    });
  });

  it('clears a server-rejected session', async () => {
    let cleared = false;
    const result = await restoreSessionState({
      getToken: async () => 'expired-token',
      clearToken: async () => {
        cleared = true;
      },
      getMe: async () => {
        throw new ApiError('Session expired or invalid', 401);
      },
    });

    expect(result).toEqual({ status: 'unauthenticated', user: null, error: null });
    expect(cleared).toBe(true);
  });

  it('turns storage failures into a recoverable state', async () => {
    const result = await restoreSessionState({
      getToken: async () => {
        throw new Error('SecureStore unavailable');
      },
      clearToken: async () => undefined,
      getMe: async () => ({ user }),
    });

    expect(result).toEqual({
      status: 'recoverable-error',
      user: null,
      error: 'SecureStore unavailable',
    });
  });

  it('does not remain loading when clearing an invalid session fails', async () => {
    const result = await restoreSessionState({
      getToken: async () => 'expired-token',
      clearToken: async () => {
        throw new Error('SecureStore unavailable');
      },
      getMe: async () => {
        throw new ApiError('Session expired or invalid', 401);
      },
    });

    expect(result.status).toBe('recoverable-error');
    expect(result.user).toBeNull();
  });
});
