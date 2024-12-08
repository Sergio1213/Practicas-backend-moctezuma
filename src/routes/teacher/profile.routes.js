import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { updateTeacherSchema } from '../../schemas/teacher.schema.js';

export const profileTeacherRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Teacher - Profile
 *   description: Teacher profile management
 */

/**
 * @swagger
 * /api/teachers/profile:
 *   get:
 *     summary: Get teacher's profile information
 *     tags: [Teacher - Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher profile data
 */
profileTeacherRouter.get('/', async (req, res) => {
  const teacherId = req.user.maestroFile.id;

  const profile = await prisma.maestro.findUnique({
    where: { id: teacherId },
    include: {
      usuario: {
        select: {
          matricula: true,
          nombre: true,
          apellido: true,
          createdAt: true
        }
      }
    }
  });

  res.json(profile);
});

/**
 * @swagger
 * /api/teachers/profile/{teacherId}:
 *   patch:
 *     summary: Update teacher's profile
 *     tags: [Teacher - Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               especialidad:
 *                 type: string
 */
profileTeacherRouter.patch('/:teacherId', validateRequest(updateTeacherSchema), async (req, res) => {
  const teacherId = parseInt(req.params.teacherId, 10); // Obtener el ID del maestro desde los parÃ¡metros
  const { nombre, apellido, especialidad } = req.body;

  try {
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Actualizar datos del usuario si se proporciona nombre o apellido
      if (nombre || apellido) {
        const maestro = await tx.maestro.findUnique({
          where: { id: teacherId },
          include: { usuario: true },
        });

        if (!maestro) {
          throw new Error(`Maestro con ID ${teacherId} no encontrado`);
        }

        await tx.usuario.update({
          where: { id: maestro.usuarioId },
          data: { 
            nombre: nombre || undefined,
            apellido: apellido || undefined,
          },
        });
      }

      // Actualizar la especialidad del maestro si se proporciona
      if (especialidad) {
        await tx.maestro.update({
          where: { id: teacherId },
          data: { especialidad },
        });
      }

      // Retornar el perfil actualizado del maestro
      return tx.maestro.findUnique({
        where: { id: teacherId },
        include: {
          usuario: {
            select: {
              matricula: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      });
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

export default profileTeacherRouter;