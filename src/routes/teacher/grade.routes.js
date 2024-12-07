import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { updateGradeSchema } from '../../schemas/grade.schema.js';
import { ForbiddenError, NotFoundError } from '../../lib/errors.js';

export const gradeRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Teacher - Grades
 *   description: Grade management operations
 */

/**
 * @swagger
 * /api/teachers/grades/{grupoId}/{alumnoId}:
 *   get:
 *     summary: Get student's grade in a specific group
 *     tags: [Teacher - Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: alumnoId
 *         required: true
 *         schema:
 *           type: integer
 */
gradeRouter.get('/:grupoId/:alumnoId', async (req, res) => {
  const maestroId = req.user.maestroFile.id;
  const grupoId = parseInt(req.params.grupoId);
  const alumnoId = parseInt(req.params.alumnoId);

  const grupo = await prisma.grupo.findFirst({
    where: { 
      id: grupoId,
      maestroId 
    }
  });

  if (!grupo) {
    throw new ForbiddenError('Not authorized to view this group');
  }

  const grade = await prisma.grupoAlumno.findUnique({
    where: {
      grupoId_alumnoId: { grupoId, alumnoId }
    },
    include: {
      alumno: {
        include: {
          usuario: {
            select: {
              matricula: true,
              nombre: true,
              apellido: true
            }
          }
        }
      }
    }
  });

  if (!grade) {
    throw new NotFoundError('Grade not found');
  }

  res.json(grade);
});

/**
 * @swagger
 * /api/teachers/grades/{grupoId}/{alumnoId}:
 *   patch:
 *     summary: Update student's grade
 *     tags: [Teacher - Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: alumnoId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - calificacion
 *             properties:
 *               calificacion:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 */
gradeRouter.patch('/:grupoId/:alumnoId', validateRequest(updateGradeSchema), async (req, res) => {
  const maestroId = req.user.maestroFile.id;
  const grupoId = parseInt(req.params.grupoId);
  const alumnoId = parseInt(req.params.alumnoId);
  const { calificacion } = req.body;

  // Verificar que el grupo pertenece al maestro
  const grupo = await prisma.grupo.findFirst({
    where: { 
      id: grupoId,
      maestroId 
    }
  });

  if (!grupo) {
    throw new ForbiddenError('Not authorized to modify this group');
  }

  // Verificar el estado del sistema
  const systemState = await prisma.systemState.findUnique({
    where: { id: 1 }
  });

  if (systemState?.estado !== 'ACTIVO') {
    throw new ForbiddenError('System is not active for grade modifications');
  }

  const updatedGrade = await prisma.$transaction(async (tx) => {
    // Actualizar calificación en el grupo
    const grade = await tx.grupoAlumno.update({
      where: {
        grupoId_alumnoId: { grupoId, alumnoId }
      },
      data: { 
        calificacion,
        fechaFinal: new Date(),
        estado: 0 // Marcar como inactivo una vez calificado
      }
    });

    // Actualizar progreso del alumno
    await tx.progresoMateria.upsert({
      where: {
        alumnoId_materiaId: {
          alumnoId,
          materiaId: grupo.materiaId
        }
      },
      update: {
        calificacion,
        completado: true,
        estadoMateria: calificacion >= 6 ? 'APROBADA' : 'REPROBADA',
        fechaFinal: new Date()
      },
      create: {
        alumnoId,
        materiaId: grupo.materiaId,
        calificacion,
        completado: true,
        estadoMateria: calificacion >= 6 ? 'APROBADA' : 'REPROBADA',
        fechaFinal: new Date()
      }
    });

    return grade;
  });

  res.json(updatedGrade);
});

export default gradeRouter;