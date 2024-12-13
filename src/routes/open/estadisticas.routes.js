import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const estadisticasRoutes = Router();






estadisticasRoutes.get("/estudiantes", async (req, res) => {
    try {
        const count = await prisma.usuario.count({
            where: {
              alumnoFile: {
                isNot: null, // Filtro para que no sea nulo
              },
            },
          });

res.json({count})

    } catch (error) {
      console.error(error);
      res.status(500)
    }
  });
  
  estadisticasRoutes.get("/profesores", async (req, res) => {
    try {
        const count = await prisma.usuario.count({
            where: {
              maestroFile: {
                isNot: null, // Filtro para que no sea nulo
              },
            },
          });

res.json({count})

    } catch (error) {
      console.error(error);
      res.status(500)
    }
  });

  estadisticasRoutes.get("/cursos", async (req, res)=>{
    try{
        const count = await prisma.curso.count();

        res.json({count})
    }
    catch (error) {
        console.error(error);
        res.status(500)
      }
  })

export default estadisticasRoutes;