import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { updateUserSchema } from '../schemas/user.schema.js';

export const studentRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student operations
 */

studentRouter.use(authenticate, authorize('ALUMNO'));

/**
 * @swagger
 * /api/students/profile:
 *   patch:
 *     summary: Update student profile
 *     tags: [Students]
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
studentRouter.patch('/profile', async (req, res) => {
  const updateData = updateUserSchema.parse(req.body);

  const updatedUser = await prisma.usuario.update({
    where: { id: req.user.id },
    data: updateData
  });

  res.json(updatedUser);
});

/**
 * @swagger
 * /api/students/progress:
 *   get:
 *     summary: Get student's academic progress
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's academic progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       materia:
 *                         type: object
 *                       completado:
 *                         type: boolean
 *                       calificacion:
 *                         type: number
 *                 totalCredits:
 *                   type: integer
 *                 completedCredits:
 *                   type: integer
 *                 progressPercentage:
 *                   type: number
 */
studentRouter.get('/progress', async (req, res) => {
  const alumnoId = req.user.alumnoId;

  const progress = await prisma.progresoMateria.findMany({
    where: { alumnoId },
    include: {
      materia: true
    }
  });

  const materias = await prisma.materia.findMany();
  const totalCredits = materias.reduce((sum, materia) => sum + materia.creditos, 0);
  
  const completedCredits = progress
    .filter(p => p.completado && p.calificacion >= 6)
    .reduce((sum, p) => sum + p.materia.creditos, 0);

  const progressPercentage = (completedCredits / totalCredits) * 100;

  res.json({
    progress,
    totalCredits,
    completedCredits,
    progressPercentage
  });
});

/**
 * @swagger
 * /api/students/available-subjects:
 *   get:
 *     summary: Get available subjects for next quarter
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available subjects
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
 *                   descripcion:
 *                     type: string
 *                   creditos:
 *                     type: integer
 *                   requisitos:
 *                     type: array
 */
studentRouter.get('/available-subjects', async (req, res) => {
  const alumnoId = req.user.alumnoId;
  const alumno = await prisma.alumno.findUnique({
    where: { id: alumnoId },
    include: {
      progreso: {
        include: { materia: true }
      }
    }
  });

  const nextQuarterSubjects = await prisma.materia.findMany({
    where: {
      grupos: {
        some: {
          cuatrimestre: alumno.cuatrimestre + 1
        }
      }
    },
    include: {
      requisitos: {
        include: { requisito: true }
      }
    }
  });

  const completedMaterias = new Set(
    alumno.progreso
      .filter(p => p.completado && p.calificacion >= 6)
      .map(p => p.materiaId)
  );

  const availableSubjects = nextQuarterSubjects.filter(materia => {
    return materia.requisitos.every(req => 
      completedMaterias.has(req.requisitoId)
    );
  });

  res.json(availableSubjects);
});

export default studentRouter;