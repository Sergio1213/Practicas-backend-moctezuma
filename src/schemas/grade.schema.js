import { z } from 'zod';

export const updateGradeSchema = z.object({
  grupoId: z.number().int().positive(),
  alumnoId: z.number().int().positive(),
  calificacion: z.number().min(0).max(10)
});