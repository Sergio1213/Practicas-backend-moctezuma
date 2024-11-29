import { Router } from 'express';
import { createUser, updateUser, deleteUser, getAllAlumnos, getAllMaestros, getAlumnosDeCurso, getAlumnosDeCursoYCuatrimestre, getAlumnosDeMateria } from '../../controllers/user.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createUserSchema, updateUserSchema } from '../../schemas/user.schema.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Users
 *   description: User management operations
 */

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matricula
 *               - nombre
 *               - apellido
 *               - role
 *             properties:
 *               matricula:
 *                 type: string
 *                 description: User's registration number (will be used as initial password)
 *               nombre:
 *                 type: string
 *                 description: User's first name
 *               apellido:
 *                 type: string
 *                 description: User's last name
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ALUMNO, MAESTRO]
 *                 description: User's role in the system
 *               especialidad:
 *                 type: string
 *                 description: Teacher's specialization (required if role is MAESTRO)
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', validateRequest(createUserSchema), createUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update a user
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ALUMNO, MAESTRO]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', validateRequest(updateUserSchema), updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteUser);

/**
 * @swagger
 * /api/admin/users/alumnos:
 *   get:
 *     summary: Get all students
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   apellido:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [ALUMNO, MAESTRO]
 *       500:
 *         description: Server error
 */
router.get('/alumnos', getAllAlumnos);

/**
 * @swagger
 * /api/admin/users/maestros:
 *   get:
 *     summary: Get all teachers
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   apellido:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [ALUMNO, MAESTRO]
 *       500:
 *         description: Server error
 */
router.get('/maestros', getAllMaestros);
/**
 * @swagger
 * /api/admin/users/curso/{cursoId}:
 *   get:
 *     summary: Get students from a specific course
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of students enrolled in the course
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   apellido:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [ALUMNO, MAESTRO]
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get('/curso/:cursoId', getAlumnosDeCurso);
/**
 * @swagger
 * /api/admin/users/curso/{cursoId}/cuatrimestre/{cuatrimestre}:
 *   get:
 *     summary: Get students from a specific course and semester
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *       - in: path
 *         name: cuatrimestre
 *         required: true
 *         schema:
 *           type: integer
 *         description: Semester
 *     responses:
 *       200:
 *         description: List of students enrolled in the course and semester
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   apellido:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [ALUMNO, MAESTRO]
 *       404:
 *         description: Course or semester not found
 *       500:
 *         description: Server error
 */
router.get('/curso/:cursoId/cuatrimestre/:cuatrimestre', getAlumnosDeCursoYCuatrimestre);
/**
 * @swagger
 *  api/admin/users/alumnos/materia/{materiaId}:
 *   get:
 *     summary: Get all students for a specific subject
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materiaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: List of students in the subject
 *       500:
 *         description: Server error
 */
router.get('/alumnos/materia/:materiaId', getAlumnosDeMateria);


export default router;