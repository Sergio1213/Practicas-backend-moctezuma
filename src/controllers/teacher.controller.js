import { prisma } from '../utils/prisma.js';

export const updateGrade = async (req, res) => {
  try {
    const { grupoId, alumnoId, calificacion } = req.body;
    const maestroId = req.user.maestroFile.id;

    // Verify teacher owns the group
    const grupo = await prisma.grupo.findFirst({
      where: {
        id: parseInt(grupoId),
        maestroId
      }
    });

    if (!grupo) {
      return res.status(403).json({ message: 'Not authorized to modify this group' });
    }

    const updatedGrade = await prisma.grupoAlumno.update({
      where: {
        grupoId_alumnoId: {
          grupoId: parseInt(grupoId),
          alumnoId: parseInt(alumnoId)
        }
      },
      data: { calificacion }
    });

    res.json(updatedGrade);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};