import { prisma } from '../lib/prisma.js';
import { EstadoMateria } from '@prisma/client';

export class ProgressManager {
  static async updateStudentProgress(alumnoId, grupoId, calificacion) {
    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      include: {
        materia: true,
        curso: true,
      },
    });

    if (!grupo) {
      throw new Error('Grupo no encontrado');
    }

    // Actualizar el progreso de la materia
    const estado = calificacion >= 6 ? EstadoMateria.APROBADA : EstadoMateria.REPROBADA;

    await prisma.progresoMateria.upsert({
      where: {
        alumnoId_materiaId: {
          alumnoId,
          materiaId: grupo.materiaId,
        },
      },
      update: {
        estado,
        calificacion,
        fechaFinal: new Date(),
      },
      create: {
        alumnoId,
        materiaId: grupo.materiaId,
        estado,
        calificacion,
        fechaFinal: new Date(),
      },
    });

    // Verificar si el alumno puede avanzar de cuatrimestre
    await this.checkQuarterProgress(alumnoId, grupo.cursoId);
  }

  static async checkQuarterProgress(alumnoId, cursoId) {
    const alumno = await prisma.alumno.findUnique({
      where: { id: alumnoId },
      include: {
        progreso: true,
      },
    });

    const planEstudios = await prisma.planEstudios.findMany({
      where: {
        cursoId,
        cuatrimestre: alumno.cuatrimestre,
      },
      include: {
        materia: true,
      },
    });

    // Verificar si todas las materias del cuatrimestre están aprobadas
    const materiasAprobadas = alumno.progreso.filter(
      (p) => p.estado === EstadoMateria.APROBADA &&
      planEstudios.some((pe) => pe.materiaId === p.materiaId)
    );

    if (materiasAprobadas.length === planEstudios.length) {
      // Avanzar al siguiente cuatrimestre
      await prisma.alumno.update({
        where: { id: alumnoId },
        data: {
          cuatrimestre: alumno.cuatrimestre + 1,
        },
      });

      // Inicializar progreso de materias del siguiente cuatrimestre
      await this.initializeNextQuarterSubjects(alumnoId, cursoId, alumno.cuatrimestre + 1);
    }
  }

  static async initializeNextQuarterSubjects(alumnoId, cursoId, cuatrimestre) {
    const materiasNextQuarter = await prisma.planEstudios.findMany({
      where: {
        cursoId,
        cuatrimestre,
      },
    });

    // Crear registros de progreso para las nuevas materias
    for (const materia of materiasNextQuarter) {
      await prisma.progresoMateria.create({
        data: {
          alumnoId,
          materiaId: materia.materiaId,
          estado: EstadoMateria.PENDIENTE,
        },
      });
    }
  }

  static async canEnrollInSubject(alumnoId, materiaId, cursoId) {
    // Verificar requisitos de la materia
    const planEstudios = await prisma.planEstudios.findFirst({
      where: {
        cursoId,
        materiaId,
      },
      include: {
        requisitos: {
          include: {
            materiaRequerida: true,
          },
        },
      },
    });

    if (!planEstudios) {
      return false;
    }

    // Verificar que todas las materias requeridas estén aprobadas
    for (const requisito of planEstudios.requisitos) {
      const progresoRequisito = await prisma.progresoMateria.findUnique({
        where: {
          alumnoId_materiaId: {
            alumnoId,
            materiaId: requisito.materiaRequeridaId,
          },
        },
      });

      if (!progresoRequisito || progresoRequisito.estado !== EstadoMateria.APROBADA) {
        return false;
      }
    }

    return true;
  }
}