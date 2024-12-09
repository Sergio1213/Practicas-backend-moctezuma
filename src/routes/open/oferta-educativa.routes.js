import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const ofertaEducativaRoutes = Router();

/**
 * @swagger
 * /api/ofertas/{id}:
 *   get:
 *     summary: Get educational offering by ID
 *     tags: [Educational Offerings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Educational offering ID
 *     responses:
 *       200:
 *         description: Educational offering details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 descripcion:
 *                   type: string
 *                 nivel:
 *                   type: string
 *                 cursos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Educational offering not found
 *       500:
 *         description: Server error
 */
ofertaEducativaRoutes.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID is required." });
  }

  try {
    const ofertaEducativa = await prisma.ofertaEducativa.findUnique({
      where: { id: parseInt(id) },
      include: {
        cursos: true,
      },
    });

    if (!ofertaEducativa) {
      return res.status(404).json({ error: "OfertaEducativa not found." });
    }

    res.status(200).json(ofertaEducativa);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "An error occurred while retrieving the OfertaEducativa.",
      });
  }
});

/**
 * @swagger
 * /api/ofertas:
 *   get:
 *     summary: Get all educational offerings
 *     tags: [Educational Offerings]
 *     responses:
 *       200:
 *         description: List of all educational offerings
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
 *                   nivel:
 *                     type: string
 *                   cursos:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nombre:
 *                           type: string
 *       404:
 *         description: No educational offerings found
 *       500:
 *         description: Server error
 */
ofertaEducativaRoutes.get("/", async (req, res) => {
  try {
    const ofertasEducativas = await prisma.ofertaEducativa.findMany({
      include: {
        cursos: true,
      },
    });
    res.status(200).json(ofertasEducativas);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "An error occurred while retrieving OfertaEducativa records.",
      });
  }
});

export default ofertaEducativaRoutes;
