import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

/**
 * Middleware de autenticación principal
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario existe y está activo
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { status: true },
    });

    if (!user || !user.status) {
      return res
        .status(401)
        .json({ error: "Usuario no encontrado o inactivo" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Token inválido" });
    }
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Middleware de autorización basado en roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Permisos insuficientes" });
    }
    next();
  };
};

/**
 * Middleware para verificar rol de alumno
 */
export const requireAlumno = (req, res, next) => {
  if (req.user.role !== "ALUMNO" || !req.user.alumnoId) {
    return res.status(403).json({ error: "Se requiere rol de alumno" });
  }
  next();
};

/**
 * Middleware para verificar rol de maestro
 */
export const requireMaestro = (req, res, next) => {
  if (req.user.role !== "MAESTRO" || !req.user.maestroId) {
    return res.status(403).json({ error: "Se requiere rol de maestro" });
  }
  next();
};

/**
 * Middleware para verificar rol de administrador
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Se requiere rol de administrador" });
  }
  next();
};

// Exportar todos los middleware
export default {
  authenticate,
  authorize,
  requireAlumno,
  requireMaestro,
  requireAdmin,
};
