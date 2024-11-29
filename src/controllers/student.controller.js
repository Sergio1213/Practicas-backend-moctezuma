import { prisma } from '../utils/prisma.js';

export const updateProfile = async (req, res) => {
  try {
    const { nombre, apellido } = req.body;
    const userId = req.user.id;

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: { nombre, apellido }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};