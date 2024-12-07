import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    matricula: z.string().min(1),
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    role: z.enum(['ADMIN', 'ALUMNO', 'MAESTRO']).optional(),
    especialidad: z.string().optional(),
    cursoId: z.number().optional(),
  }),
});

export const updateUserSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'ALUMNO', 'MAESTRO']).optional()
});