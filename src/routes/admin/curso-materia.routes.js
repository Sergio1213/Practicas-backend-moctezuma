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
 * /api/admin/curso-materia:
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
cursoMateriaRoutes.patch('/', async (req, res) => {
  const { cursoId, materiaId, newCursoId, newMateriaId } = req.body;

  if (!cursoId || !materiaId) {
    return res.status(400).json({ error: 'cursoId and materiaId are required.' });
  }

  try {
    const cursoMateria = await prisma.cursoMateria.findUnique({
      where: {
        cursoId_materiaId: {
          cursoId,
          materiaId
        }
      }
    });

    if (!cursoMateria) {
      return res.status(404).json({ error: 'Course and subject are not linked or do not exist.' });
    }

    const updatedCursoMateria = await prisma.cursoMateria.update({
      where: {
        cursoId_materiaId: {
          cursoId,
          materiaId
        }
      },
      data: {
        cursoId: newCursoId || cursoId,
        materiaId: newMateriaId || materiaId
      }
    });

    res.status(200).json(updatedCursoMateria);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the CursoMateria relation.' });
  }
});
export default cursoMateriaRoutes;