import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loginSchema, changePasswordSchema } from '../schemas/auth.schema.js';
import { UnauthorizedError } from '../lib/errors.js';

export const authRouter = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matricula
 *               - password
 *             properties:
 *               matricula:
 *                 type: string
 *                 description: User's registration number
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     matricula:
 *                       type: string
 *                     nombre:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', async (req, res) => {
  const { matricula, password } = loginSchema.parse(req.body);


  
  const user = await prisma.usuario.findUnique({ where: { matricula },
  include:{
    alumnoFile:{
      include:{
        curso:true,
      }
    }
  }
  });
  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { 
    id: user.id,
    matricula: user.matricula,
    nombre: user.nombre,
    role: user.role,
    ...(user.role === 'ALUMNO' && {
      curso: user.alumnoFile?.curso?.nombre || null, // Añade el cursoId si el rol es ALUMNO
    }),
  }});
});

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Current password is incorrect
 */
authRouter.patch('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  
  const user = await prisma.usuario.findUnique({
    where: { id: req.user.id }
  });

  if (!await bcrypt.compare(currentPassword, user.password)) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.usuario.update({
    where: { id: req.user.id },
    data: { password: hashedPassword }
  });

  res.json({ message: 'Password updated successfully' });
});
export default authRouter;