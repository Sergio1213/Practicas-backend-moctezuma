import { z } from 'zod';

export const loginSchema = z.object({
  matricula: z.string().min(1, 'Matricula is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6)
});