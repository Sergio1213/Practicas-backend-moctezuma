import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { updateGradeSchema } from '../schemas/grade.schema.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';

export const teacherRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: Teacher operations
 */

teacherRouter.use(authenticate, authorize('MAESTRO'));

/**
 * @swagger
 * /api/teachers/grupos:
 *   get:
 *     summary: Get teacher's groups
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teacher's groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   identificador:
 *                     type: string
 *                   materia:
 *                     type: object
 *                   alumnos:
 *                     type: array
 */
teacherRouter.get('/grupos', async (req, res) => {
  const maestroId = req.user.maestroFile.id;

  const grupos = await prisma.grupo.findMany({
    where: { maestroId },
    include: {
      materia: true,
      alumnos: {
        include: {
          alumno: {
            include: {
              usuario: true
            }
          }
        }
      }
    }
  });

  res.json(grupos);
});

/**
 * @swagger
 * /api/teachers/grades:
 *   patch:
 *     summary: Update student grade
 *     tags: [Teachers]
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
 *               - alumnoId
 *               - calificacion
 *             properties:
 *               grupoId:
 *                 type: integer
 *               alumnoId:
 *                 type: integer
 *               calificacion:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Grade updated successfully
 *       403:
 *         description: Not authorized to modify this group
 */
teacherRouter.patch('/grades', async (req, res) => {
  const { grupoId, alumnoId, calificacion } = updateGradeSchema.parse(req.body);
  const maestroId = req.user.maestroFile.id;

  const grupo = await prisma.grupo.findFirst({
    where: { id: grupoId, maestroId }
  });

  if (!grupo) {
    throw new ForbiddenError('Not authorized to modify this group');
  }

  const updatedGrade = await prisma.grupoAlumno.update({
    where: {
      grupoId_alumnoId: { grupoId, alumnoId }
    },
    data: { calificacion }
  });

  res.json(updatedGrade);
});

export default teacherRouter;