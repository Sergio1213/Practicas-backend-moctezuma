import { z } from 'zod';

export const updateTeacherSchema = z.object({
  body: z.object({
    nombre: z.string().min(1).optional(),
    apellido: z.string().min(1).optional(),
    especialidad: z.string().min(1).optional()
  })
}).refine(
  data => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);