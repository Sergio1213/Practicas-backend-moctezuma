import { z } from 'zod';

export const ofertaEducativaSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  nivel: z.string().min(1)
});

export const cursoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  duracion: z.string().min(1),
  ofertaEducativaId: z.number().int().positive()
});

export const materiaSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  creditos: z.number().int().positive(),
  requisitosIds: z.array(z.number().int().positive()).optional()
});
