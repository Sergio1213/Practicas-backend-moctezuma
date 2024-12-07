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
 * /api/teachers/profile:
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
profileTeacherRouter.patch('/', validateRequest(updateTeacherSchema), async (req, res) => {
  const teacherId = req.user.maestroFile.id;
  const { nombre, apellido, especialidad } = req.body;

  const updatedProfile = await prisma.$transaction(async (tx) => {
    if (nombre || apellido) {
      await tx.usuario.update({
        where: { id: req.user.id },
        data: { 
          nombre: nombre || undefined,
          apellido: apellido || undefined
        }
      });
    }

    if (especialidad) {
      await tx.maestro.update({
        where: { id: teacherId },
        data: { especialidad }
      });
    }

    return tx.maestro.findUnique({
      where: { id: teacherId },
      include: {
        usuario: {
          select: {
            matricula: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });
  });

  res.json(updatedProfile);
});

export default profileTeacherRouter;