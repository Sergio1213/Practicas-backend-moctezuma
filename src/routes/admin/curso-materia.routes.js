import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

export const cursoMateriaRoutes = Router();

/**
 * @swagger
 * /api/admin/curso-materia:
 *   post:
 *     summary: Create a new course-subject relation
 *     tags: [Admin Course-Subject Relations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cursoId
 *               - materiaId
 *             properties:
 *               cursoId:
 *                 type: integer
 *               materiaId:
 *                 type: integer
*               cuatrimestre:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Course-subject relation created
 *       400:
 *         description: Invalid input or relation already exists
 *       500:
 *         description: Server error
 */
cursoMateriaRoutes.post('/', async (req, res) => {
  const { cursoId, materiaId,cuatrimestre } = req.body;

  try {
    // Verificamos si ya existe la relación entre curso y materia
    const existingRelation = await prisma.cursoMateria.findUnique({
      where: { cursoId_materiaId:{
        cursoId,
        materiaId
      }
      }
    });

    if (existingRelation) {
      return res.status(400).json({ error: 'This course and subject are already linked.' });
    }

    // Si no existe la relación, creamos una nueva
    const cursoMateria = await prisma.cursoMateria.create({
      data: {
        cursoId,
        materiaId,
        cuatrimestre
      }
    });

    res.status(201).json(cursoMateria);
  } catch (error) {
    console.error(error);  // Para ver más detalles del error
    res.status(500).json({ error: 'An error occurred while creating the CursoMateria relation.' });
  }
});

/**
 * @swagger
 * /api/admin/curso-materia/{id}:
 *   delete:
 *     summary: Delete a course-subject relation
 *     tags: [Admin Course-Subject Relations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Relation ID
 *     responses:
 *       200:
 *         description: Relation deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Relation not found
 *       500:
 *         description: Server error
 */
cursoMateriaRoutes.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID is required.' });
  }

  try {
    const cursoMateria = await prisma.cursoMateria.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cursoMateria) {
      return res.status(404).json({ error: 'CursoMateria relation does not exist or the ID is incorrect.' });
    }

    await prisma.cursoMateria.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: 'CursoMateria successfully deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the CursoMateria relation.' });
  }
});

/**
 * @swagger
 * /api/admin/curso-materia/{id}:
 *   patch:
 *     summary: Update a course-subject relation
 *     tags: [Admin Course-Subject Relations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cursoId
 *               - materiaId
 *             properties:
 *               cursoId:
 *                 type: integer
 *               materiaId:
 *                 type: integer
 *               newCursoId:
 *                 type: integer
 *               newMateriaId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Relation updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Relation not found
 *       500:
 *         description: Server error
 */
cursoMateriaRoutes.patch('/:id', async (req, res) => {
  const { id } = req.params; // Identificar el registro
  const { cursoId, materiaId, cuatrimestre } = req.body; // Nuevos valores

  try {
    // Verificar si el registro de CursoMateria existe
    const cursoMateria = await prisma.cursoMateria.findUnique({
      where: { id: parseInt(id, 10) }, // Asegurar que el id sea un número
    });

    if (!cursoMateria) {
      return res.status(404).json({ error: 'CursoMateria not found.' });
    }

    // Verificar existencia del nuevo curso si se proporciona
    if (cursoId) {
      const cursoExists = await prisma.curso.findUnique({ where: { id: cursoId } });
      if (!cursoExists) {
        return res.status(400).json({ error: `Curso with id ${cursoId} does not exist.` });
      }
    }

    // Verificar existencia de la nueva materia si se proporciona
    if (materiaId) {
      const materiaExists = await prisma.materia.findUnique({ where: { id: materiaId } });
      if (!materiaExists) {
        return res.status(400).json({ error: `Materia with id ${materiaId} does not exist.` });
      }
    }

    // Actualizar el registro
    const updatedCursoMateria = await prisma.cursoMateria.update({
      where: { id: parseInt(id, 10) },
      data: {
        cursoId: cursoId || cursoMateria.cursoId,
        materiaId: materiaId || cursoMateria.materiaId,
        cuatrimestre: cuatrimestre !== undefined ? cuatrimestre : cursoMateria.cuatrimestre,
      },
    });

    res.status(200).json(updatedCursoMateria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating CursoMateria.' });
  }
});

export default cursoMateriaRoutes;