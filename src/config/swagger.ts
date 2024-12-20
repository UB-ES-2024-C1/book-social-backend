import swaggerJsdoc from 'swagger-jsdoc';

const isDevelopment = process.env.NODE_ENV !== 'production';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BookSocial Backend API',
      version: '1.0.0',
      description: 'Documentación de la API de BookSocial Backend',
    },
    servers: [
      {
        url: '/',
        description: isDevelopment
          ? 'Servidor de desarrollo'
          : 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/docs/**/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
