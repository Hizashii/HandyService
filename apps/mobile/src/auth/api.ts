import type { AuthCredentials, RegistrationInput, User } from './types';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

type AuthResponse = {
  user: User;
  sessionToken: string;
  expiresAt: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Unable to reach HelpDK. Check your connection.', 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.error ?? 'Something went wrong. Try again.', response.status);
  }
  return payload as T;
}

export function register(input: RegistrationInput): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: AuthCredentials): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMe(token: string): Promise<{ user: User }> {
  return request<{ user: User }>('/api/auth/me', {}, token);
}

export function logout(token: string): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' }, token);
}
