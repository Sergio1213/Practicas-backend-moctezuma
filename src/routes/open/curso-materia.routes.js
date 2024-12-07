import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

export const cursoMateriaRoutesOpen = Router();

/**
 * @swagger
 * /api/curso-materia/{id}:
 *   get:
 *     summary: Get a specific course-subject relation
 *     tags: [Course-Subject Relations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Relation ID
 *     responses:
 *       200:
 *         description: Course-subject relation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 cursoId:
 *                   type: integer
 *                 materiaId:
 *                   type: integer
 *                 curso:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                 materia:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Relation not found
 *       500:
 *         description: Server error
 */
cursoMateriaRoutesOpen.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID is required.' });
  }

  try {
    const cursoMateria = await prisma.cursoMateria.findUnique({
      where: { id: parseInt(id) },
      include: {
        curso: true,
        materia: true,
      },
    });

    if (!cursoMateria) {
      return res.status(404).json({ error: 'CursoMateria relation not found.' });
    }

    res.status(200).json(cursoMateria);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the CursoMateria relation.' });
  }
});

/**
 * @swagger
 * /api/curso-materia/curso/{cursoId}:
 *   get:
 *     summary: Get all subjects for a specific course
 *     tags: [Course-Subject Relations]
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of course-subject relations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   cursoId:
 *                     type: integer
 *                   materiaId:
 *                     type: integer
 *                   curso:
 *                     type: object
 *                   materia:
 *                     type: object
 *       404:
 *         description: No relations found
 *       500:
 *         description: Server error
 */
cursoMateriaRoutesOpen.get('/curso/:cursoId', async (req, res) => {
  const { cursoId } = req.params;
  // Obtener el nombre del curso
const curso = await prisma.curso.findUnique({
  where: { id: parseInt(cursoId) },
  select: {
    nombre: true, // Solo seleccionamos el nombre del curso
  },
});

if (!curso) {
  return res.status(404).json({ error: 'Curso not found.' });
}

  try {
    const cursoMaterias = await prisma.cursoMateria.findMany({
      where: { cursoId: parseInt(cursoId) },
      include: {
        materia: true,
      },
    });

    if (!cursoMaterias.length) {
      return res.status(404).json({ error: 'No relations found for the given course.' });
    }

    res.status(200).json({
      curso: curso.nombre,
      materias: cursoMaterias.map(cm => cm.materia),
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the CursoMateria relations.' });
  }
});

/**
 * @swagger
 * /api/curso-materia/materia/{materiaId}:
 *   get:
 *     summary: Get all courses for a specific subject
 *     tags: [Course-Subject Relations]
 *     parameters:
 *       - in: path
 *         name: materiaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: List of course-subject relations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   cursoId:
 *                     type: integer
 *                   materiaId:
 *                     type: integer
 *                   curso:
 *                     type: object
 *                   materia:
 *                     type: object
 *       404:
 *         description: No relations found
 *       500:
 *         description: Server error
 */
cursoMateriaRoutesOpen.get('/materia/:materiaId', async (req, res) => {
  const { materiaId } = req.params;

  const materia = await prisma.materia.findUnique({
    where: { id: parseInt(materiaId) },
    select: {
      nombre: true, // Solo seleccionamos el nombre del curso
    },
  });

  if (!materia) {
    return res.status(404).json({ error: 'Materia not found.' });
  }
  

  try {
    const cursoMaterias = await prisma.cursoMateria.findMany({
      where: { materiaId: parseInt(materiaId) },
      include: {
        curso: true,
      },
    });

    if (!cursoMaterias.length) {
      return res.status(404).json({ error: 'No relations found for the given subject.' });
    }

    res.status(200).json({
      materia: materia.nombre,
      cursos: cursoMaterias.map(cm => cm.curso),
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the CursoMateria relations.' });
  }
});

export default cursoMateriaRoutesOpen;