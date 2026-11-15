import { z } from 'zod';

export const emailSchema = z.string().trim().email().max(254);

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  role: z.enum(['customer', 'provider']),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
