import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { horarioSchema } from '../../schemas/horario.schema.js';
import { ForbiddenError, NotFoundError } from '../../lib/errors.js';

export const HorarioRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Admin - Horarios
 *   description: Schedule management operations
 */

/**
 * @swagger
 * /api/admin/horarios:
 *   post:
 *     summary: Create a new schedule for a group
 *     tags: [Admin - Horarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grupoId
 *               - dia
 *               - horaInicio
 *               - horaFin
 *             properties:
 *               grupoId:
 *                 type: integer
 *               dia:
 *                 type: string
 *                 enum: [Lunes, Martes, Miércoles, Jueves, Viernes, Sábado]
 *               horaInicio:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               horaFin:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 */
HorarioRouter.post('/', validateRequest(horarioSchema), async (req, res) => {
  const { grupoId, dia, horaInicio, horaFin } = req.body;

  // Verificar si hay conflictos de horario
  const conflicto = await prisma.horarioGrupo.findFirst({
    where: {
      grupoId,
      dia,
      OR: [
        {
          AND: [
            { horaInicio: { lte: horaInicio } },
            { horaFin: { gt: horaInicio } }
          ]
        },
        {
          AND: [
            { horaInicio: { lt: horaFin } },
            { horaFin: { gte: horaFin } }
          ]
        }
      ]
    }
  });

  if (conflicto) {
    throw new ForbiddenError('Existe un conflicto de horario para este grupo');
  }

  const horario = await prisma.horarioGrupo.create({
    data: {
      grupoId,
      dia,
      horaInicio,
      horaFin
    }
  });

  res.status(201).json(horario);
});

/**
 * @swagger
 * /api/admin/horarios/{id}:
 *   patch:
 *     summary: Update a group schedule
 *     tags: [Admin - Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dia:
 *                 type: string
 *                 enum: [Lunes, Martes, Miércoles, Jueves, Viernes, Sábado]
 *               horaInicio:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               horaFin:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 */
HorarioRouter.patch('/:id', validateRequest(horarioSchema.partial()), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const horario = await prisma.horarioGrupo.findUnique({
    where: { id: parseInt(id) }
  });

  if (!horario) {
    throw new NotFoundError('Horario no encontrado');
  }

  // Verificar conflictos si se está actualizando el horario
  if (updateData.horaInicio || updateData.horaFin || updateData.dia) {
    const conflicto = await prisma.horarioGrupo.findFirst({
      where: {
        grupoId: horario.grupoId,
        dia: updateData.dia || horario.dia,
        id: { not: parseInt(id) },
        OR: [
          {
            AND: [
              { horaInicio: { lte: updateData.horaInicio || horario.horaInicio } },
              { horaFin: { gt: updateData.horaInicio || horario.horaInicio } }
            ]
          },
          {
            AND: [
              { horaInicio: { lt: updateData.horaFin || horario.horaFin } },
              { horaFin: { gte: updateData.horaFin || horario.horaFin } }
            ]
          }
        ]
      }
    });

    if (conflicto) {
      throw new ForbiddenError('Existe un conflicto de horario para este grupo');
    }
  }

  const updatedHorario = await prisma.horarioGrupo.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  res.json(updatedHorario);
});

/**
 * @swagger
 * /api/admin/horarios/{id}:
 *   delete:
 *     summary: Delete a group schedule
 *     tags: [Admin - Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
HorarioRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.horarioGrupo.delete({
    where: { id: parseInt(id) }
  });

  res.json({ message: 'Horario eliminado exitosamente' });
});

/**
 * @swagger
 * /api/admin/horarios/grupo/{grupoId}:
 *   get:
 *     summary: Get all schedules for a specific group
 *     tags: [Admin - Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema:
 *           type: integer
 */
HorarioRouter.get('/grupo/:grupoId', async (req, res) => {
  const { grupoId } = req.params;

  const horarios = await prisma.horarioGrupo.findMany({
    where: { grupoId: parseInt(grupoId) },
    orderBy: [
      {
        dia: 'asc'
      },
      {
        horaInicio: 'asc'
      }
    ]
  });

  res.json(horarios);
});

export default HorarioRouter;