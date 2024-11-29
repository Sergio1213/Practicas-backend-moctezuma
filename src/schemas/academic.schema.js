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

export const createGrupoSchema = z.object({
  nombre: z.string().min(1),
  identificador: z.string().min(1),
  horario: z.string().min(1),
  diasClase: z.string().min(1),
  maestroId: z.number().int().positive(),
  cursoId: z.number().int().positive(),
  materiaId: z.number().int().positive(),
});