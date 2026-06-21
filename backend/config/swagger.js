const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API Documentation',
      version: '1.0.0',
      description: 'API documentation for the TaskFlow Task Management System',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'Access token cookie for authentication',
        },
      },
    },
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Scan routes and controllers for annotations
};

const swaggerSpec = swaggerJsdoc(options);

const serveSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger documentation loaded at http://localhost:5000/api-docs');
};

module.exports = serveSwagger;
