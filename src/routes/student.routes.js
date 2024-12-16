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

  try {
    // Obtener el progreso del alumno y las materias relacionadas
    const progress = await prisma.progresoMateria.findMany({
      where: { alumnoId },
      include: {
        materia: {
          include: {
            cursos: { // Incluir los cursos asociados a la materia
              where: {
                curso: {
                  alumnos: {
                    some: { alumnoId: alumnoId }, // Relacionar con el alumno
                  },
                },
              },
              include: {
                curso: {
                  include: {
                    materias: true, // Incluir las materias de cada curso
                  },
                },
              },
            },
          },
        },
      },
    });

    // Mapear el progreso de las materias
    const formattedProgress = progress.map((p) => ({
      cuatrimestre: p.cuatrimestre,
      materia: {
        nombre: p.materia.nombre,
        status: p.status || null,
        calificacion: p.calificacion || null,
        fechaFinal: p.fechaFinal || null,
      },
    }));

    // Agrupar las materias por cuatrimestre
    const cuatrimestres = formattedProgress.reduce((acc, item) => {
      if (!acc[item.cuatrimestre]) {
        acc[item.cuatrimestre] = [];
      }
      acc[item.cuatrimestre].push(item.materia);
      return acc;
    }, {});

    // Crear la respuesta con cuatrimestres y las materias correspondientes
    const response = Object.keys(cuatrimestres).map((cuatrimestre) => ({
      cuatrimestre: parseInt(cuatrimestre),
      materias: cuatrimestres[cuatrimestre],
    }));

    res.json(response);
  } catch (error) {
    console.error("Error al obtener el progreso:", error);
    res.status(500).json({ error: "Error al obtener el progreso" });
  }
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