import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().trim().email('Indtast en gyldig e-mailadresse'),
  password: z.string().min(1, 'Indtast din adgangskode'),
});

export const registerFormSchema = z.object({
  email: z.string().trim().email('Indtast en gyldig e-mailadresse'),
  password: z.string().min(8, 'Brug mindst 8 tegn').max(128, 'Brug højst 128 tegn'),
  role: z.enum(['customer', 'provider']),
});
