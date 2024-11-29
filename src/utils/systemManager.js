import { prisma } from '../lib/prisma.js';
import { EstadoMateria } from '@prisma/client';
import { ProgressManager } from './progressManager.js';

export class SystemManager {
  static async endQuarter() {
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Finalizar calificaciones pendientes
      await tx.grupoAlumno.updateMany({
        where: {
          calificacion: null,
          estado: 1 // Activo
        },
        data: {
          calificacion: 0,
          estado: 0, // Inactivo
          fechaFinal: new Date()
        }
      });

      // 2. Actualizar progreso de materias
      const gruposAlumnos = await tx.grupoAlumno.findMany({
        where: { estado: 1 },
        include: {
          alumno: true,
          grupo: {
            include: {
              materia: true
            }
          }
        }
      });

      for (const grupoAlumno of gruposAlumnos) {
        await tx.progresoMateria.upsert({
          where: {
            alumnoId_materiaId: {
              alumnoId: grupoAlumno.alumnoId,
              materiaId: grupoAlumno.grupo.materiaId
            }
          },
          update: {
            estado: grupoAlumno.calificacion >= 6 ? EstadoMateria.APROBADA : EstadoMateria.REPROBADA,
            calificacion: grupoAlumno.calificacion,
            fechaFinal: new Date()
          },
          create: {
            alumnoId: grupoAlumno.alumnoId,
            materiaId: grupoAlumno.grupo.materiaId,
            estado: grupoAlumno.calificacion >= 6 ? EstadoMateria.APROBADA : EstadoMateria.REPROBADA,
            calificacion: grupoAlumno.calificacion,
            fechaFinal: new Date()
          }
        });
      }

      // 3. Avanzar cuatrimestre para alumnos elegibles
      const alumnos = await tx.alumno.findMany({
        include: {
          progreso: true,
          curso: {
            include: {
              planEstudios: {
                where: {
                  cuatrimestre: {
                    equals: tx.alumno.cuatrimestre
                  }
                }
              }
            }
          }
        }
      });

      let studentsAdvanced = 0;

      for (const alumno of alumnos) {
        const materiasAprobadas = alumno.progreso.filter(
          p => p.estado === EstadoMateria.APROBADA
        ).length;

        const materiasRequeridas = alumno.curso.planEstudios.length;

        if (materiasAprobadas >= materiasRequeridas) {
          await tx.alumno.update({
            where: { id: alumno.id },
            data: { cuatrimestre: alumno.cuatrimestre + 1 }
          });
          studentsAdvanced++;
        }
      }

      return { studentsAdvanced };
    });

    return {
      message: 'Quarter ended successfully',
      studentsAdvanced: transaction.studentsAdvanced,
      quarterClosed: true
    };
  }

  static async updateSystemState(maintenance) {
    const newState = maintenance ? 'MANTENIMIENTO' : 'ACTIVO';
  
    const systemState = await prisma.systemState.upsert({
      where: { id: 1 },
      update: { estado: newState },
      create: {
        id: 1,
        estado: newState,
      },
    });
  
    return {
      message: maintenance
        ? 'System entered maintenance mode'
        : 'System is now active',
      estado: systemState.estado,
    };
  }
  
}