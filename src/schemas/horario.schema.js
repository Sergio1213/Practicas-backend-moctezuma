import { z } from 'zod';

const diasValidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const horarioSchema = z.object({
  grupoId: z.number().int().positive(),
  dia: z.enum(diasValidos),
  horaInicio: z.string().regex(horaRegex, 'Formato de hora inválido (HH:mm)'),
  horaFin: z.string().regex(horaRegex, 'Formato de hora inválido (HH:mm)')
}).refine(
  (data) => {
    const inicio = data.horaInicio.split(':').map(Number);
    const fin = data.horaFin.split(':').map(Number);
    const inicioMinutos = inicio[0] * 60 + inicio[1];
    const finMinutos = fin[0] * 60 + fin[1];
    return finMinutos > inicioMinutos;
  },
  {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['horaFin']
  }
);