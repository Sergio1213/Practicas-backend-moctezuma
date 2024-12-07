import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { updateGradeSchema } from '../../schemas/grade.schema.js';
import { ForbiddenError } from '../../lib/errors.js';

export const grupoMaestroRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Teacher - Groups
 *   description: Group management for teachers
 */

grupoMaestroRouter.use(authenticate, authorize('MAESTRO'));

/**
 * @swagger
 * /api/teachers/grupos:
 *   get:
 *     summary: Get all groups for the authenticated teacher
 *     tags: [Teacher - Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teacher's groups with details
 */
grupoMaestroRouter.get('/', async (req, res) => {
  const usuarioId = req.user.id;  // Asumiendo que req.user contiene el id del usuario

  try {
    // Buscar el maestro basado en el usuarioId
    const maestro = await prisma.maestro.findUnique({
      where: { usuarioId },
      include: {
        grupos: {
          include: {
            cursoMateria: {
              include: {
                curso: true,
                materia: true
              }
            },
            horarios: true,
            alumnos: {
              include: {
                alumno: {
                  include: {
                    usuario: {
                      select: {
                        nombre: true,
                        apellido: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Verificar si el maestro fue encontrado
    if (!maestro) {
      return res.status(404).json({ error: 'Maestro no encontrado' });
    }

    // Obtener los grupos
    const grupos = maestro.grupos;  // Ahora tenemos los grupos del maestro

    // Verificar que los grupos no sean undefined
    if (!grupos) {
      return res.status(404).json({ error: 'No hay grupos disponibles para este maestro' });
    }

    // Transformar la respuesta para incluir los detalles necesarios
    const formattedResponse = grupos.map(grupo => ({
      curso: grupo.cursoMateria.curso.nombre,
      idMateria: grupo.cursoMateria.materia.id,
      materia: grupo.cursoMateria.materia.nombre,
      horarios: grupo.horarios.map(horario => ({
        dia: horario.dia,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin
      })),
      alumnos: grupo.alumnos.map(alumno => ({
        id: alumno.alumno.id,
        nombre: alumno.alumno.usuario?.nombre || 'Desconocido',  // Usamos el optional chaining
        apellido: alumno.alumno.usuario?.apellido || 'Desconocido'
      }))
    }));

    // Devolver la respuesta formateada
    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


/**
 * @swagger
 * /api/teachers/grupos/{id}:
 *   get:
 *     summary: Get detailed information about a specific group
 *     tags: [Teacher - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detailed group information
 *       403:
 *         description: Not authorized to view this group
 *       404:
 *         description: Group not found
 */
grupoMaestroRouter.get('/:id', async (req, res) => {
  const maestroId = req.user.maestroFile.id;
  const grupoId = parseInt(req.params.id);

  const grupo = await prisma.grupo.findFirst({
    where: { 
      id: grupoId,
      maestroId 
    },
    include: {
      materia: true,
      horarios: true,
      alumnos: {
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  matricula: true,
                  nombre: true,
                  apellido: true
                }
              },
              progreso: {
                where: {
                  materia: {
                    grupos: {
                      some: {
                        id: grupoId
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!grupo) {
    throw new ForbiddenError('Not authorized to view this group or group not found');
  }

  res.json(grupo);
});

/**
 * @swagger
 * /api/teachers/grupos/{grupoId}/alumnos/{alumnoId}/calificacion:
 *   patch:
 *     summary: Update student's grade in a group
 *     tags: [Teacher - Groups]
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
 *     responses:
 *       200:
 *         description: Grade updated successfully
 *       403:
 *         description: Not authorized to modify this group
 */
grupoMaestroRouter.patch('/:grupoId/alumnos/:alumnoId/calificacion', 
  validateRequest(updateGradeSchema),
  async (req, res) => {
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

    // Actualizar calificación
    const updatedGrade = await prisma.grupoAlumno.update({
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
    await prisma.progresoMateria.upsert({
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

    res.json(updatedGrade);
});

export default grupoMaestroRouter;