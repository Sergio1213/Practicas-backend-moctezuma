import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';

export const createUser = async (req, res) => {
  try {
    const { matricula, nombre, apellido, role } = req.body;
    
    // Use matricula as initial password
    const hashedPassword = await bcrypt.hash(matricula, 10);
    
    const user = await prisma.usuario.create({
      data: {
        matricula,
        nombre,
        apellido,
        password: hashedPassword,
        role,
        ...(role === 'ALUMNO' && {
          alumnoFile: {
            create: {}
          }
        }),
        ...(role === 'MAESTRO' && {
          maestroFile: {
            create: {
              especialidad: req.body.especialidad || ''
            }
          }
        })
      }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, role } = req.body;

    const user = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { nombre, apellido, role }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.usuario.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};