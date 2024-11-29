import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js';
import { createGrupoSchema, ofertaEducativaSchema, cursoSchema, materiaSchema } from '../schemas/academic.schema.js';
import { validateRequest } from '../middleware/validation.middleware.js';

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
 *               totalCreditos:
 *                 type: integer
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
 *               - identificador
 *               - cuatrimestre
 *               - horario
 *               - diasClase
 *               - materiaId
 *               - maestroId
 *             properties:
 *               nombre:
 *                 type: string
 *               identificador:
 *                 type: string
 *               horario:
 *                 type: string
 *               diasClase:
 *                 type: string
 *               materiaId:
 *                 type: integer
 *               maestroId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Group created successfully
 */
adminRouter.post('/grupos', async (req, res) => {
  try {
    // Validar datos de entrada
    const data = createGrupoSchema.parse(req.body);

    // Verificar si existe la relación CursoMateria
    const cursoMateria = await prisma.cursoMateria.findUnique({
      where: {
        cursoId_materiaId: {
          cursoId: data.cursoId,
          materiaId: data.materiaId,
        },
      },
    });

    // Si no existe, devolver un error
    if (!cursoMateria) {
      return res.status(404).json({
        error: 'La relación entre el curso y la materia no existe.',
      });
    }

    // Crear el grupo usando cursoMateriaId
    const grupo = await prisma.grupo.create({
      data: {
        nombre: data.nombre,
        identificador: data.identificador,
        horario: data.horario,
        diasClase: data.diasClase,
        maestroId: data.maestroId,
        cursoMateriaId: cursoMateria.id,
      },
    });

    res.status(201).json(grupo);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});


/**
 * @swagger
 * /api/admin/grupos/{id}:
 *   patch:
 *     summary: Update a group
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the group to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Name of the group
 *               identificador:
 *                 type: string
 *                 description: Identifier of the group
 *               materiaId:
 *                 type: integer
 *                 description: ID of the related subject
 *               maestroId:
 *                 type: integer
 *                 description: ID of the teacher assigned to the group
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 identificador:
 *                   type: string
 *                 materia:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     creditos:
 *                       type: integer
 *                 maestro:
 *                   type: object
 *                   properties:
 *                     usuario:
 *                       type: object
 *                       properties:
 *                         nombre:
 *                           type: string
 *                         apellido:
 *                           type: string
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
adminRouter.patch('/:id', validateRequest(createGrupoSchema.partial()), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const grupo = await prisma.grupo.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        materia: {
          select: {
            nombre: true,
            creditos: true
          }
        },
        maestro: {
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
    });

    res.json(grupo);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Group not found' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error updating group' });
  }
});

/**
 * @swagger
 * /api/admin/grupos/{id}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       404:
 *         description: Group not found
 */
adminRouter.delete('/grupos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.grupo.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: 'Group not found' });
  }
});
export default adminRouter;