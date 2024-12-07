import { z } from 'zod';

const horarioSchema = z.object({
    body: z.object({  
        dia: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']),
        horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)})
}).refine(
  data => {
    const inicio = data.horaInicio.split(':').map(Number);
    const fin = data.horaFin.split(':').map(Number);
    const inicioMinutos = inicio[0] * 60 + inicio[1];
    const finMinutos = fin[0] * 60 + fin[1];
    return finMinutos > inicioMinutos;
  },
  {
    message: 'La hora de fin debe ser posterior a la hora de inicio'
  }
);

export const createGrupoSchema = z.object({
    body: z.object({
        nombre: z.string().min(1),
        identificador: z.string().min(1),
        cursoMateriaId: z.number().int().positive(),
        maestroId: z.number().int().positive(),
        horarios: z.array(horarioSchema).optional()
    })
});

export const updateGrupoSchema = z.object({
    body: z.object({
        nombre: z.string().min(1).optional(),
        identificador: z.string().min(1).optional(),
        maestroId: z.number().int().positive().optional(),
        horarios: z.array(horarioSchema).optional()
    })

});