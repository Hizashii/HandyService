export type UserRole = 'customer' | 'provider';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  created_at: number;
  updated_at: number;
};

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'recoverable-error';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegistrationInput = AuthCredentials & {
  role: UserRole;
};
