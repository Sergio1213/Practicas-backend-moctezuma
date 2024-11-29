import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management API',
      version: '1.0.0',
      description: 'API documentation for the School Management System',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            matricula: { type: 'string' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'ALUMNO', 'MAESTRO'] },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['matricula', 'nombre', 'apellido', 'role'],
          properties: {
            matricula: { type: 'string' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'ALUMNO', 'MAESTRO'] },
            especialidad: { type: 'string' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'ALUMNO', 'MAESTRO'] },
          },
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/**/*.js'],
};

export const specs = swaggerJsdoc(options);