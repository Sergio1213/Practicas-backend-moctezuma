import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const cursoRoutes = Router();

/**
 * @swagger
 * /api/cursos:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of all courses
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
 *                   duracion:
 *                     type: string
 *                   totalCreditos:
 *                     type: integer
 *                   ofertaEducativaId:
 *                     type: integer
 *       404:
 *         description: No courses found
 *       500:
 *         description: Server error
 */
cursoRoutes.get("/", async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany();

    res.status(200).json(cursos);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while retrieving Curso records." });
  }
});

/**
 * @swagger
 * /api/cursos/{id}:
 *   get:
 *     summary: Get course by ID with its subjects
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details with associated subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 curso:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *                     duracion:
 *                       type: string
 *                     totalCreditos:
 *                       type: integer
 *                 materias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       creditos:
 *                         type: integer
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
cursoRoutes.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID is required." });
  }

  try {
    // Obtener el curso por su ID
    const curso = await prisma.curso.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        duracion: true,
        totalCreditos: true,
      },
    });

    if (!curso) {
      return res.status(404).json({ error: "Curso not found." });
    }

    // Obtener las materias relacionadas con el curso
    const cursoMaterias = await prisma.cursoMateria.findMany({
      where: { cursoId: parseInt(id, 10) },
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

    // Construir la respuesta
    const response = {
      curso,
      materias: cursoMaterias.map((cm) => ({
        id: cm.materia.id,
        nombre: cm.materia.nombre,
        creditos: cm.materia.creditos,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the Curso." });
  }
});

export default cursoRoutes;
