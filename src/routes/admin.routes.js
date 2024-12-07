import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {  ofertaEducativaSchema, cursoSchema, materiaSchema } from '../schemas/academic.schema.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { createGrupoSchema, updateGrupoSchema } from '../schemas/grupo.schema.js';
import { NotFoundError } from '../lib/errors.js';

export const adminRouter = Router();

/**
 * @swagger
 * /api/admin/ofertas:
 *   post:
 *     summary: Create a new educational offering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - descripcion
 *               - nivel
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Name of the educational offering
 *               descripcion:
 *                 type: string
 *                 description: Description of the educational offering
 *               nivel:
 *                 type: string
 *                 description: Educational level
 *     responses:
 *       201:
 *         description: Educational offering created successfully
 */
adminRouter.post('/ofertas', async (req, res) => {
  const data = ofertaEducativaSchema.parse(req.body);
  
  const oferta = await prisma.ofertaEducativa.create({
    data
  });

  res.status(201).json(oferta);
});
/**
 * @swagger
 * /api/admin/ofertas/{id}:
 *   patch:
 *     summary: Update an educational offering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Offering ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               nivel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offering updated successfully
 *       404:
 *         description: Offering not found
 */
adminRouter.patch('/ofertas/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = ofertaEducativaSchema.partial().parse(req.body);

  try {
    const oferta = await prisma.ofertaEducativa.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(oferta);
  } catch (error) {
    res.status(404).json({ message: 'Offering not found' });
  }
});

/**
 * @swagger
 * /api/admin/ofertas/{id}:
 *   delete:
 *     summary: Delete an educational offering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Offering ID
 *     responses:
 *       200:
 *         description: Offering deleted successfully
 *       400:
 *         description: Cannot delete offering with dependent courses
 *       404:
 *         description: Offering not found
 */
adminRouter.delete('/ofertas/:id', async (req, res) => {
  const { id } = req.params;

  const dependentCourses = await prisma.curso.findMany({
    where: { ofertaEducativaId: parseInt(id) },
    select: { id: true, nombre: true },
  });

  if (dependentCourses.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete offering with dependent courses',
      dependentCourses,
    });
  }

  try {
    await prisma.ofertaEducativa.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Offering deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: 'Offering not found' });
  }
});

/**
 * @swagger
 * /api/admin/cursos:
 *   post:
 *     summary: Create a new course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - descripcion
 *               - duracion
 *               - totalCreditos
 *               - ofertaEducativaId
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               duracion:
 *                 type: string
 *               ofertaEducativaId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Course created successfully
 */
adminRouter.post('/cursos', async (req, res) => {
  const data = cursoSchema.parse(req.body);
  
  const curso = await prisma.curso.create({
    data
  });

  res.status(201).json(curso);
});
/**
 * @swagger
 * /api/admin/cursos/{id}:
 *   patch:
 *     summary: Update a course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               duracion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 */
adminRouter.patch('/cursos/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = (req.body);

  try {
    const curso = await prisma.curso.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(curso);
  } catch (error) {
    res.status(404).json({ message: 'Course not found' });
  }
});

/**
 * @swagger
 * /api/admin/cursos/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       400:
 *         description: Course has dependent subjects
 *       404:
 *         description: Course not found
 */
adminRouter.delete('/cursos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar las materias dependientes del curso
    const materias = await prisma.cursoMateria.findMany({
      where: { cursoId: parseInt(id) },
      include: {
        materia: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Verificar si existen materias dependientes
    if (materias.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete course with dependent subjects',
        dependents: materias.map(materia => materia.materia), // Obtener solo las materias
      });
    }

    // Si no hay dependencias, proceder con la eliminación del curso
    await prisma.curso.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: 'Course not found' });
  }
});


/**
 * @swagger
 * /api/admin/materias:
 *   post:
 *     summary: Create a new subject
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - descripcion
 *               - creditos
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               creditos:
 *                 type: integer
 *               requisitosIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Subject created successfully
 */
adminRouter.post('/materias', async (req, res) => {
  const data = materiaSchema.parse(req.body);
  
  const materia = await prisma.materia.create({
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      creditos: data.creditos,
      ...(data.requisitosIds && {
        requisitos: {
          create: data.requisitosIds.map(requisitoId => ({
            requisito: { connect: { id: requisitoId } }
          }))
        }
      })
    }
  });

  res.status(201).json(materia);
});

/**
 * @swagger
 * /api/admin/materias/{id}:
 *   patch:
 *     summary: Update a subject
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               creditos:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       404:
 *         description: Subject not found
 */
adminRouter.patch('/materias/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = (req.body);

  try {
    const materia = await prisma.materia.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(materia);
  } catch (error) {
    res.status(404).json({ message: 'Subject not found' });
  }
});

/**
 * @swagger
 * /api/admin/materias/{id}:
 *   delete:
 *     summary: Eliminar materia
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la materia que se desea eliminar
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Materia eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject deleted successfully
 *       400:
 *         description: Error, la materia tiene relaciones activas en los cursos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot delete subject with active course relations
 *                 dependents:
 *                   type: array
 *                   items:
 *                     type: integer
 *                     example: 1
 *       404:
 *         description: La materia no fue encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject not found
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
adminRouter.delete('/materias/:id', async (req, res) => {
  const { id } = req.params;

  // Verificar si la materia tiene dependencias activas en CursoMateria
  const cursoMateria = await prisma.cursoMateria.findMany({
    where: { materiaId: parseInt(id) },
    include: {
      curso: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  // Si hay dependencias activas (relaciones con cursos), no se permite eliminar
  if (cursoMateria.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete subject with active course relations',
      dependents: cursoMateria.map(cm => ({
        cursoId: cm.curso.id,  // ID del curso relacionado
        cursoNombre: cm.curso.nombre, // Nombre del curso relacionado
      })),
    });
  }

  try {
    // Eliminar la materia
    await prisma.materia.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: 'Subject not found' });
  }
});
/**
 * @swagger
 * /api/admin/grupos:
 *   post:
 *     summary: Create a new group
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - identificador
 *               - cursoMateriaId
 *               - maestroId
 *             properties:
 *               nombre:
 *                 type: string
 *               identificador:
 *                 type: string
 *               cursoMateriaId:
 *                 type: integer
 *               maestroId:
 *                 type: integer
 *               horarios:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dia:
 *                       type: string
 *                     horaInicio:
 *                       type: string
 *                     horaFin:
 *                       type: string
 */
adminRouter.post('/grupos', validateRequest(createGrupoSchema), async (req, res) => {
  const { body: data } = req;

  // Verificar que el maestro existe
  const maestro = await prisma.maestro.findUnique({
    where: { id: data.maestroId },
  });

  if (!maestro) {
    throw new NotFoundError('Teacher not found');
  }

  // Verificar que CursoMateria existe
  const cursoMateria = await prisma.cursoMateria.findUnique({
    where: { id: data.cursoMateriaId },
    include: {
      curso: true,
      materia: true,
    },
  });

  if (!cursoMateria) {
    throw new NotFoundError('CursoMateria not found');
  }

  // Crear el grupo y sus horarios en una transacción
  const grupo = await prisma.$transaction(async (tx) => {
    // Crear el grupo
    const newGrupo = await tx.grupo.create({
      data: {
        nombre: data.nombre,
        identificador: data.identificador,
        cuatrimestre: cursoMateria.cuatrimestre, // Traer del cursoMateria encontrado
        cursoMateriaId: cursoMateria.id, // Relación directa
        maestroId: data.maestroId,
        horarios: data.horarios
          ? {
              createMany: {
                data: data.horarios.map((horario) => ({
                  dia: horario.dia,
                  horaInicio: horario.horaInicio,
                  horaFin: horario.horaFin,
                })),
              },
            }
          : undefined, // Crear horarios solo si se proporcionaron
      },
      include: {
        cursoMateria: {
          select: {
            curso: {
              select:{
                nombre:true
              }
            },
            materia: {
              select: {
                nombre: true, // Solo incluye el nombre de la materia
              },
            },
          },
        },
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
        horarios: true, // Incluir los horarios creados
      },
    });

    return newGrupo;
  });

  // Enviar la respuesta con el grupo creado
  res.status(201).json(grupo);
});



/**
 * @swagger
 * /api/admin/grupos/{id}:
 *   patch:
 *     summary: Update a group
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
adminRouter.patch('/grupos/:id', validateRequest(updateGrupoSchema), async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  // Verificar si el maestro existe al actualizar maestroId
  if (data.maestroId) {
    const maestro = await prisma.maestro.findUnique({
      where: { id: data.maestroId },
    });

    if (!maestro) {
      throw new NotFoundError('Teacher not found');
    }
  }

  const grupo = await prisma.$transaction(async (tx) => {
    if (data.horarios) {
      // Eliminar horarios existentes
      await tx.horarioGrupo.deleteMany({
        where: { grupoId: parseInt(id) },
      });

      // Crear nuevos horarios
      await tx.horarioGrupo.createMany({
        data: data.horarios.map((horario) => ({
          ...horario,
          grupoId: parseInt(id),
        })),
      });
    }

    // Actualizar grupo
    return tx.grupo.update({
      where: { id: parseInt(id) },
      data: {
        nombre: data.nombre,
        identificador: data.identificador,
        maestroId: data.maestroId,
      },
      include: {
        cursoMateria: {
          select: {
            curso: true,
            materia: {
              select: {
                nombre: true,
              },
            },
          },
        },
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
        horarios: true,
      },
    });
  });

  res.json(grupo);
});

/**
 * @swagger
 * /api/admin/grupos/{id}:
 *   delete:
 *     summary: Delete a group and its schedules
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
adminRouter.delete('/grupos/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.grupo.delete({
    where: { id: parseInt(id) },
  });

  res.json({ message: 'Group deleted successfully' });
});
/**
 * @swagger
 * /api/admin/grupos/{id}:
 *   get:
 *     summary: Get a group by its ID
 *     tags: [Admin - Groups]
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
 *         description: A group object
 *       404:
 *         description: Group not found
 */
adminRouter.get('/grupos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const grupo = await prisma.grupo.findUnique({
      where: { id: parseInt(id) },
      include: {
        cursoMateria: {
          select: {
            curso: {
              select: {
                nombre: true,
                descripcion: true,
              },
            },
            materia: {
              select: {
                nombre: true,
                descripcion: true,
                creditos: true,
              },
            },
          },
        },
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
        horarios: {
          select: {
            dia: true,
            horaInicio: true,
            horaFin: true,
          },
        },
        alumnos: {
          include: {
            alumno: {
              include: {
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
                progreso: {
                  select: {
                    materia: {
                      select: {
                        nombre: true,
                      },
                    },
                    calificacion: true,
                    estadoMateria: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Transformar los datos al formato solicitado
    const formattedResponse = {
      curso: grupo.cursoMateria.curso.nombre,
      idMateria: grupo.cursoMateria.materia.id,
      materia: grupo.cursoMateria.materia.nombre,
      maestro: {
        nombre: grupo.maestro.usuario.nombre,
        apellido: grupo.maestro.usuario.apellido
      },
      horarios: grupo.horarios.map(horario => ({
        dia: horario.dia,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin
      })),
      alumnos: grupo.alumnos.map(alumno => ({
        id: alumno.alumno.id,
        nombre: alumno.alumno.usuario.nombre,
        apellido: alumno.alumno.usuario.apellido,
        cuatrimestre: alumno.alumno.cuatrimestre,
        pago: alumno.alumno.pago
      }))
    };

    return res.status(200).json(formattedResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el grupo' });
  }
});


/**
 * @swagger
 * /api/admin/grupos/curso/{cursoId}:
 *   get:
 *     summary: Get all groups for a specific course
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 */
adminRouter.get('/grupos/curso/:cursoId', async (req, res) => {
  const { cursoId } = req.params;

  const grupos = await prisma.grupo.findMany({
    where: { cursoMateria: { cursoId: parseInt(cursoId) } },
    include: {
      cursoMateria: {
        select: {
          curso:{ select:{
              nombre:true
          }} ,
          materia: {
            select: {
              nombre: true,
            },
          },
        },
      },
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
      horarios: true,
    },
  });

  res.json(grupos);
});


/**
 * @swagger
 * /api/admin/grupos/curso/{cursoId}/cuatrimestre/{cuatrimestre}:
 *   get:
 *     summary: Get all groups for a specific course and quarter
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: cuatrimestre
 *         required: true
 *         schema:
 *           type: integer
 */
adminRouter.get('/grupos/curso/:cursoId/cuatrimestre/:cuatrimestre', async (req, res) => {
  const { cursoId, cuatrimestre } = req.params;

  const grupos = await prisma.grupo.findMany({
    where: {
      cursoMateria: { cursoId: parseInt(cursoId) },
      cuatrimestre: parseInt(cuatrimestre),
    },
    include: {
      cursoMateria: {
        select: {
          curso: true,
          materia: {
            select: {
              nombre: true,
            },
          },
        },
      },
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
      horarios: true,
    },
  });

  res.json(grupos);
});

/**
 * @swagger
 * /api/admin/grupos/agregar-alumnos:
 *   post:
 *     summary: Agrega varios alumnos a un grupo específico
 *     tags: [Admin - Grupos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: ID del grupo al que se agregarán los alumnos
 *                 example: 1
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Lista de IDs de los alumnos a agregar
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Alumnos agregados al grupo exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Alumnos agregados al grupo exitosamente"
 *       400:
 *         description: Error en la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "El grupo no pertenece al curso del alumno"
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */



// Endpoint para agregar alumnos a un grupo
adminRouter.post('/grupos/agregar-alumnos', async (req, res) => {
  const { groupId, studentIds } = req.body;

  console.log(groupId,studentIds)

  // Validar entrada
  if (!groupId || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'Faltan datos o formato incorrecto.' });
  }

  try {
    // Obtener información del grupo y su curso relacionado
    const group = await prisma.grupo.findUnique({
      where: { id: groupId },
      include: { cursoMateria: { include: { curso: true } } },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado.' });
    }

    // Validar que los alumnos pertenezcan al curso del grupo
    const alumnos = await prisma.alumno.findMany({
      where: {
        id: { in: studentIds },
      },
      include: { curso: true },
    });

    const invalidStudents = alumnos.filter(
      (alumno) => alumno.cursoId !== group.cursoMateria.curso.id
    );

    if (invalidStudents.length > 0) {
      return res.status(400).json({
        error: 'Algunos alumnos no pertenecen al curso del grupo.',
        invalidStudentIds: invalidStudents.map((s) => s.id),
      });
    }

    // Registrar la relación en la tabla GrupoAlumno
    const transactions = studentIds.map((studentId) =>
      prisma.grupoAlumno.create({
        data: {
          grupoId: groupId,
          alumnoId: studentId,
        },
      })
    );

    await prisma.$transaction(transactions);

    res.status(200).json({ message: 'Alumnos agregados al grupo exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al agregar alumnos al grupo.' });
  }
});


export default adminRouter;