import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { loginSchema, changePasswordSchema } from "../schemas/auth.schema.js";
import { UnauthorizedError } from "../lib/errors.js";

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
authRouter.post("/login", async (req, res) => {
  const { matricula, password } = loginSchema.parse(req.body);

  try {
    // Obtener al usuario y sus relaciones
    const user = await prisma.usuario.findUnique({
      where: { matricula },
      include: {
        alumnoFile: {
          include: {
            curso: true,
            grupos: {
              include: {
                grupo: true,
              },
            },
          },
        },
        maestroFile: {
          include: {
            grupos: true,
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!user.status) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    // Preparar datos específicos según el rol
    let roleSpecificData = {};

    switch (user.role) {
      case "ALUMNO":
        if (!user.alumnoFile) {
          return res
            .status(400)
            .json({ error: "Datos de alumno no encontrados" });
        }
        roleSpecificData = {
          alumnoId: user.alumnoFile.id,
          curso: user.alumnoFile.curso.nombre,
          cuatrimestre: user.alumnoFile.cuatrimestre,
          pago: user.alumnoFile.pago,
        };
        break;

      case "MAESTRO":
        if (!user.maestroFile) {
          return res
            .status(400)
            .json({ error: "Datos de maestro no encontrados" });
        }
        roleSpecificData = {
          maestroId: user.maestroFile.id,
          especialidad: user.maestroFile.especialidad,
        };
        break;

      case "ADMIN":
        // Para administradores no necesitamos datos adicionales
        break;

      default:
        return res.status(400).json({ error: "Rol de usuario no válido" });
    }

    // Generar el token JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        ...roleSpecificData,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Preparar la respuesta
    const response = {
      token,
      user: {
        id: user.id,
        matricula: user.matricula,
        nombre: `${user.nombre} ${user.apellido}`,
        role: user.role,
        ...roleSpecificData,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error durante el login:", error);

    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Datos de entrada inválidos", details: error.errors });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
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
authRouter.patch("/change-password", authenticate, async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const user = await prisma.usuario.findUnique({
    where: { id: req.user.id },
  });

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.usuario.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  res.json({ message: "Password updated successfully" });
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Fetch authenticated user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 matricula:
 *                   type: string
 *                 nombre:
 *                   type: string
 *                 role:
 *                   type: string
 *                 curso:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */

authRouter.get("/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // ID extraído del token JWT por el middleware de autenticación

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    res.json({
      id: user.id,
      matricula: user.matricula,
      nombre: user.nombre,
      apellido: user.apellido,
      role: user.role,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving profile", error: error.message });
  }
});

export default authRouter;
