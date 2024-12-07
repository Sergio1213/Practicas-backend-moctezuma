import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger/index.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { studentRouter } from './routes/student.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { materiaRoutes } from './routes/open/materia.routes.js';
import { authenticate, authorize } from './middleware/auth.middleware.js';
import userRoutes from './routes/admin/user.routes.js';
import cursoMateriaRoutes from './routes/admin/curso-materia.routes.js';
import systemRouter from './routes/admin/system.routes.js';
import cursoRoutes from './routes/open/curso.routes.js';
import cursoMateriaRoutesOpen from './routes/open/curso-materia.routes.js';
import ofertaEducativaRoutes from './routes/open/oferta-educativa.routes.js';
import grupoMaestroRouter from './routes/teacher/grupo.routes.js';
import profileTeacherRouter from './routes/teacher/profile.routes.js';
import gradeRouter from './routes/teacher/grade.routes.js';

dotenv.config();


const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api/auth', authRouter);
app.use('/api/admin',authenticate, authorize('ADMIN'), adminRouter);
app.use('/api/students', studentRouter);
app.use('/api/materias', materiaRoutes);
app.use('/api/admin/users', authenticate, authorize('ADMIN'), userRoutes);
app.use('/api/admin/curso-materia', authenticate, authorize('ADMIN'), cursoMateriaRoutes);
app.use('/api/admin/system', authenticate, authorize('ADMIN'), systemRouter);
app.use('/api/cursos', cursoRoutes);
app.use('/api/curso-materia', cursoMateriaRoutesOpen);
app.use('/api/ofertas', ofertaEducativaRoutes);
app.use('/api/teachers/grupos', authenticate, authorize('MAESTRO'),grupoMaestroRouter);
app.use('/api/teachers/profile',authenticate, authorize('MAESTRO'), profileTeacherRouter);
app.use('/api/teachers/grade',authenticate, authorize('MAESTRO'), gradeRouter);


app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});