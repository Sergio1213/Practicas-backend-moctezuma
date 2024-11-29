import { Router } from 'express';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { systemStateSchema } from '../../schemas/system.schema.js';
import { SystemManager } from '../../utils/systemManager.js';

export const systemRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Admin - System
 *   description: System management operations
 */

/**
 * @swagger
 * /api/admin/system/end-quarter:
 *   post:
 *     summary: End current quarter and advance students
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quarter ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 studentsAdvanced:
 *                   type: integer
 *                 quarterClosed:
 *                   type: boolean
 */
systemRouter.post('/end-quarter', async (req, res) => {
  const result = await SystemManager.endQuarter();
  res.json(result);
});

/**
 * @swagger
 * /api/admin/system/state:
 *   patch:
 *     summary: Update system state (maintenance/active)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maintenance
 *             properties:
 *               maintenance:
 *                 type: boolean
 *                 description: System maintenance state
 *     responses:
 *       200:
 *         description: System state updated successfully
 */
systemRouter.patch('/state', async (req, res) => {
  const { maintenance } = req.body;

  // Validación manual
  if (typeof maintenance !== 'boolean') {
    return res.status(400).json({
      message: "Validation error",
      errors: [
        {
          message: "Maintenance state is required and must be a boolean",
        }
      ]
    });
  }

  // Llamada al método de actualización del estado del sistema
  const result = await SystemManager.updateSystemState(maintenance);
  res.json(result);
});



export default systemRouter;