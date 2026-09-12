import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Fitness & Workout Platform API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API powering a complete modern gym and fitness application, including exercise libraries, workout tracking, personal records, progress analytics, and multi-week programs.',
    contact: {
      name: 'API Support',
      email: 'support@fitnessapp.local',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token in the format: Bearer <token>',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Resource not found' },
              details: { type: 'object', nullable: true },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['USER', 'TRAINER', 'ADMIN'] },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] },
        },
      },
      Exercise: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          category: { type: 'string' },
          equipment: { type: 'string' },
          difficulty: { type: 'string' },
          primaryMuscle: { type: 'string' },
          instructions: { type: 'array', items: { type: 'string' } },
        },
      },
      WorkoutTemplate: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          isPublic: { type: 'boolean' },
          estimatedDuration: { type: 'integer' },
        },
      },
      WorkoutSession: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] },
          durationSeconds: { type: 'integer' },
          totalVolumeKg: { type: 'number' },
          totalCalories: { type: 'integer' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
