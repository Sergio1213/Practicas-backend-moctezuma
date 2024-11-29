import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

export const materiaRoutes = Router();

/**
 * @swagger
 * /api/materias:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: List of all subjects
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
 *                   creditos:
 *                     type: integer
 *       404:
 *         description: No subjects found
 *       500:
 *         description: Server error
 */
materiaRoutes.get('/', async (req, res) => {
  try {
    const materias = await prisma.materia.findMany({
      select: {
        id: true,
        nombre: true,
        creditos: true,
      },
    });

    if (materias.length === 0) {
      return res.status(404).json({ message: 'No subjects found' });
    }

    res.status(200).json(materias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving subjects' });
  }
});

/**
 * @swagger
 * /api/materias/{id}:
 *   get:
 *     summary: Get a subject by ID
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the subject to retrieve
 *     responses:
 *       200:
 *         description: Details of the subject
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 creditos:
 *                   type: integer
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Server error
 */
materiaRoutes.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const materia = await prisma.materia.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        creditos: true,
        descripcion: true,
      },
    });

    if (!materia) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.status(200).json(materia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving the subject' });
  }
});


export default materiaRoutes;