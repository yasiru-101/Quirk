const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quirk API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Quirk Task Management System',
    },
    // Relative server URL so "Try it out" targets whatever host is serving this
    // page — http://localhost:5000/api in development and
    // https://quirk-app.ddns.net/api in production — instead of a hardcoded host.
    servers: [
      {
        url: '/api',
        description: 'Current host',
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
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        // Send the httpOnly auth cookie with "Try it out" requests so protected
        // endpoints work when the operator is logged into Quirk on the same origin.
        withCredentials: true,
        requestInterceptor: (req) => {
          req.credentials = 'include';
          return req;
        },
      },
    })
  );
  console.log('Swagger documentation loaded at /api-docs');
};

module.exports = serveSwagger;
