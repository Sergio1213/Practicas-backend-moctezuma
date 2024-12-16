import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const estadisticasRoutes = Router();

/**
 * @swagger
 * /api/estadisticas/usuarios:
 *   get:
 *     summary: Get the count of all users
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Total count of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/estadisticas/estudiantes:
 *   get:
 *     summary: Get the count of students
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Total count of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/estadisticas/profesores:
 *   get:
 *     summary: Get the count of professors
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Total count of professors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/estadisticas/cursos:
 *   get:
 *     summary: Get the count of courses
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Total count of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */

estadisticasRoutes.get("/usuarios", async (req, res) => {
  try {
    const count = await prisma.usuario.count();
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

estadisticasRoutes.get("/estudiantes", async (req, res) => {
  try {
    const count = await prisma.usuario.count({
      where: {
        alumnoFile: {
          isNot: null, // Filtro para que no sea nulo
        },
      },
    });

    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

estadisticasRoutes.get("/profesores", async (req, res) => {
  try {
    const count = await prisma.usuario.count({
      where: {
        maestroFile: {
          isNot: null, // Filtro para que no sea nulo
        },
      },
    });

    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

estadisticasRoutes.get("/cursos", async (req, res) => {
  try {
    const count = await prisma.curso.count();

    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

export default estadisticasRoutes;
