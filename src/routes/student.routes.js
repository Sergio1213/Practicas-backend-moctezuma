import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { updateUserSchema } from "../schemas/user.schema.js";

export const studentRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student operations
 */

studentRouter.use(authenticate, authorize("ALUMNO"));

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
studentRouter.patch("/profile", async (req, res) => {
  const updateData = updateUserSchema.parse(req.body);

  const updatedUser = await prisma.usuario.update({
    where: { id: req.user.id },
    data: updateData,
  });

  res.json(updatedUser);
});

/**
 * @swagger
 * /api/students/materias-actuales:
 *   get:
 *     summary: Get subjects and schedules for the student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subjects the student is currently enrolled in, along with their schedules.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 materias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       grupoId:
 *                         type: integer
 *                       nombreGrupo:
 *                         type: string
 *                       materia:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *                       creditos:
 *                         type: integer
 *                       horarios:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             dia:
 *                               type: string
 *                             horaInicio:
 *                               type: string
 *                               format: date-time
 *                             horaFin:
 *                               type: string
 *                               format: date-time
 *       403:
 *         description: The user is not authorized to access the resource or the user is not a student.
 *       500:
 *         description: Error retrieving the student's subjects.
 */

studentRouter.get("/materias-actuales", async (req, res) => {
  try {
    // Extraer el alumnoId del token JWT
    const alumnoId = req.user.alumnoId;

    console.log("alumnoId", alumnoId);
    // Buscar las materias cursadas por el alumno
    const materiasCursando = await prisma.grupoAlumno.findMany({
      where: {
        alumnoId, // Filtra por el ID del alumno extraído del token
      },
      include: {
        grupo: {
          include: {
            cursoMateria: {
              include: {
                materia: true, // Información de la materia
              },
            },
            horarios: true, // Horarios del grupo
            maestro: {
              include: {
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Estructurar la respuesta para que sea más clara
    const response = materiasCursando.map((grupoAlumno) => ({
      grupoId: grupoAlumno.grupo.id,
      nombreGrupo: grupoAlumno.grupo.nombre,
      maestro: `${grupoAlumno.grupo.maestro.usuario.nombre} ${grupoAlumno.grupo.maestro.usuario.apellido}`, // Nombre y apellido del maestro
      materia: grupoAlumno.grupo.cursoMateria.materia.nombre,
      descripcion: grupoAlumno.grupo.cursoMateria.materia.descripcion,
      creditos: grupoAlumno.grupo.cursoMateria.materia.creditos,
      horarios: grupoAlumno.grupo.horarios.map((horario) => ({
        dia: horario.dia,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
      })),
    }));

    res.json({ materias: response });
  } catch (error) {
    console.error("Error al obtener materias del alumno:", error);
    res.status(500).json({ error: "Error al obtener las materias" });
  }
});

studentRouter.get("/calificaciones", async (req, res) => {
  try {
    // Extraer el alumnoId del token JWT
    const alumnoId = req.user.alumnoId;

    console.log("alumnoId", alumnoId);

    // Buscar las calificaciones del alumno
    const calificaciones = await prisma.grupoAlumno.findMany({
      where: {
        alumnoId, // Filtra por el ID del alumno
      },
      select: {
        calificacion: true, // Solo calificación
        grupo: {
          select: {
            cursoMateria: {
              select: {
                materia: {
                  select: {
                    nombre: true, // Nombre de la materia
                  },
                },
              },
            },
            maestro: {
              select: {
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true, // Nombre y apellido del maestro
                  },
                },
              },
            },
          },
        },
      },
    });

    // Formatear la respuesta
    const response = calificaciones.map((grupoAlumno) => ({
      calificacion: grupoAlumno.calificacion,
      materia: grupoAlumno.grupo.cursoMateria.materia.nombre,
      maestro: `${grupoAlumno.grupo.maestro.usuario.nombre} ${grupoAlumno.grupo.maestro.usuario.apellido}`,
    }));

    res.json({ calificaciones: response });
  } catch (error) {
    console.error("Error al obtener calificaciones del alumno:", error);
    res.status(500).json({ error: "Error al obtener las calificaciones" });
  }
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
studentRouter.get("/progress", async (req, res) => {
  const alumnoId = req.user.alumnoId;

  console.log("alumnoId", alumnoId);

  try {
    // Obtener el progreso del alumno y las materias relacionadas
    const progress = await prisma.progresoMateria.findMany({
      where: {
        alumnoId: alumnoId, // Filtra por alumnoId en el modelo ProgresoMateria
      },
      include: {
        materia: {
          select: {
            nombre: true, // Incluye el nombre de la materia
          },
        }, // Incluye la información de la materia
      },
    });

    if (progress.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró progreso para el alumno" });
    }

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

studentRouter.get("/progress-comparado", async (req, res) => {
  const alumnoId = req.user.alumnoId;

  console.log("alumnoId", alumnoId);

  try {
    // 1. Obtener las materias actuales que el alumno está cursando
    const materiasActuales = await prisma.grupoAlumno.findMany({
      where: { alumnoId },
      include: {
        grupo: {
          include: {
            cursoMateria: {
              include: {
                materia: true,
              },
            },
          },
        },
      },
    });

    // Extraer IDs de materias actuales
    const materiasActualesIds = materiasActuales.map(
      (grupoAlumno) => grupoAlumno.grupo.cursoMateria.materia.id
    );

    // 2. Obtener todo el progreso del alumno
    const progress = await prisma.progresoMateria.findMany({
      where: { alumnoId },
      include: {
        materia: {
          select: {
            id: true,
            nombre: true,
            creditos: true,
          },
        },
      },
    });

    // 3. Comparar y ajustar el status
    const adjustedProgress = progress.map((p) => {
      const isCursando = materiasActualesIds.includes(p.materia.id);

      return {
        materia: p.materia.nombre,
        creditosMateria: p.materia.creditos,
        status: isCursando ? "CURSANDO" : p.status,
        calificacion: p.calificacion || null,
        fechaFinal: p.fechaFinal || null,
        cuatrimestre: p.cuatrimestre,
      };
    });

    // 4. Respuesta al cliente
    res.json({ progreso: adjustedProgress });
  } catch (error) {
    console.error("Error al comparar progreso con materias actuales:", error);
    res.status(500).json({ error: "Error al obtener el progreso comparado" });
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
studentRouter.get("/available-subjects", async (req, res) => {
  const alumnoId = req.user.alumnoId;
  const alumno = await prisma.alumno.findUnique({
    where: { id: alumnoId },
    include: {
      progreso: {
        include: { materia: true },
      },
    },
  });

  const nextQuarterSubjects = await prisma.materia.findMany({
    where: {
      grupos: {
        some: {
          cuatrimestre: alumno.cuatrimestre + 1,
        },
      },
    },
    include: {
      requisitos: {
        include: { requisito: true },
      },
    },
  });

  const completedMaterias = new Set(
    alumno.progreso
      .filter((p) => p.completado && p.calificacion >= 6)
      .map((p) => p.materiaId)
  );

  const availableSubjects = nextQuarterSubjects.filter((materia) => {
    return materia.requisitos.every((req) =>
      completedMaterias.has(req.requisitoId)
    );
  });

  res.json(availableSubjects);
});

export default studentRouter;
