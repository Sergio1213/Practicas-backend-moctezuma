import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

function formatResponse(data, statusCode = 200) {
    if (statusCode === 200) {
      return {
        status: 'success',
        data: data || [],
      };
    } else {
      return {
        status: 'error',
        message: 'Server error',
      };
    }
  }
  
  export const createUser = async (req, res) => {
    try {
      const { matricula, nombre, apellido, role, cursoId, especialidad } = req.body;
  
      if (!matricula || !nombre || !apellido ) {
        return res.status(400).json({ message: 'Faltan datos obligatorios.' });
      }
  
      // Validación según el rol
      if (role === 'ALUMNO' && !cursoId) {
        return res.status(400).json({ message: 'El campo cursoId es obligatorio para el rol ALUMNO.' });
      }
  
      // Hashear la matrícula como contraseña
      const hashedPassword = await bcrypt.hash(matricula, 10);
  
      // Crear usuario con relaciones condicionales
      const user = await prisma.usuario.create({
        data: {
          matricula,
          nombre,
          apellido,
          password: hashedPassword,
          role,
          alumnoFile: role === 'ALUMNO' || !role ? {
            create: {
              cursoId: cursoId,
              cuatrimestre: 1, // Valor predeterminado
              pago: false,
            },
          } : undefined,
          maestroFile: role === 'MAESTRO' ? {
            create: {
              especialidad: especialidad || '',
            },
          } : undefined,
        },
        include: {
          alumnoFile: true,
          maestroFile: true,
        },
      });
  
      res.status(201).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
    }
  };
  

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user' });
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
    console.error(error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};


export const getAllAlumnos = async (req, res) => {
    try {
      const alumnos = await prisma.usuario.findMany({
        where: {
          role: 'ALUMNO',  // Filtra por el rol de 'alumno'
        }, include:{
          alumnoFile: true
        }
      });
  
        // Usar la función de formateo para la respuesta
        const response = formatResponse(alumnos);

        // Enviar la respuesta formateada
        return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching alumnos' });
    }
  };

  export const getAllMaestros = async (req, res) => {
    try {
      const maestros = await prisma.usuario.findMany({
        where: {
          role: 'MAESTRO',  // Filtra por el rol de 'maestro'
        },
      });
  
       // Usar la función de formateo para la respuesta
       const response = formatResponse(maestros);

       // Enviar la respuesta formateada
       return res.status(200).json(response);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching maestros' });
    }
  };
  
  export const getAlumnosDeCurso = async (req, res) => {
    const { cursoId } = req.params;
  
    try {
      const alumnos = await prisma.curso.findUnique({
        where: {
          id: parseInt(cursoId),
        },
        include: {
          alumnos: true  // Asumiendo que en el modelo 'Curso' tienes la relación con los alumnos
        }
      });
  
            // Usar la función de formateo para la respuesta
            const response = formatResponse(alumnos);

            // Enviar la respuesta formateada
            return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving students for the course' });
    }
  };

  
  export const getAlumnosDeCursoYCuatrimestre = async (req, res) => {
    const { cursoId, cuatrimestre } = req.params;
  
    try {
      const alumnos = await prisma.curso.findUnique({
        where: {
          id: parseInt(cursoId),
        },
        include: {
          alumnos: {
            where: {
              cuatrimestre: parseInt(cuatrimestre),
            }
          }
        }
      });
             // Usar la función de formateo para la respuesta
             const response = formatResponse(alumnos);

             // Enviar la respuesta formateada
             return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving students for the course and semester' });
    }
  };

  export const getAlumnosDeMateria = async (req, res) => { 
    const { materiaId } = req.params;
  
    try {
      // Encuentra los cursos asociados con la materia
      const cursoMateria = await prisma.cursoMateria.findMany({
        where: {
          materiaId: parseInt(materiaId), // Filtramos por la materia
        },
        include: {
          curso: {
            include: {
              alumnos: true, // Traemos los alumnos asociados con los cursos
            }
          }
        }
      });
  
      // Extraemos los alumnos de cada curso asociado con esa materia
      const alumnos = cursoMateria.flatMap(cm => cm.curso.alumnos);

  
      // Usar la función de formateo para la respuesta
             const response = formatResponse(alumnos);

             // Enviar la respuesta formateada
             return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving students for the subject' });
    }
  };
  