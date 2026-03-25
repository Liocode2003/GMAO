import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SGRH Cabinet API',
      version: '1.0.0',
      description: 'API REST du Système de Gestion des Ressources Humaines — Forvis Mazars',
      contact: { name: 'Support SGRH', email: 'support@cabinet.bf' },
    },
    servers: [
      { url: '/api', description: 'Serveur principal' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            matricule: { type: 'string', example: 'EMP001' },
            first_name: { type: 'string', example: 'Jean' },
            last_name: { type: 'string', example: 'Dupont' },
            email: { type: 'string', format: 'email' },
            function: { type: 'string', enum: ['AUDITEUR','MANAGER_PRINCIPAL','ASSOCIE','DIRECTEUR'] },
            grade: { type: 'string', example: 'JUNIOR' },
            service_line: { type: 'string', example: 'AUDIT_ASSURANCE' },
            contract_type: { type: 'string', enum: ['CDI','CDD','STAGE','CONSULTANT','FREELANCE'] },
            entry_date: { type: 'string', format: 'date' },
            exit_date: { type: 'string', format: 'date', nullable: true },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string', enum: ['DRH','DIRECTION_GENERALE','ASSOCIE','MANAGER','UTILISATEUR'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification et gestion des sessions' },
      { name: 'Employees', description: 'Gestion des collaborateurs' },
      { name: 'KPIs', description: 'Indicateurs et tableaux de bord' },
      { name: 'Trainings', description: 'Formations' },
      { name: 'Leaves', description: 'Congés et absences' },
      { name: 'Commercial', description: 'Soumissions commerciales' },
      { name: 'Users', description: 'Gestion des utilisateurs' },
      { name: 'Reports', description: 'Rapports et exports' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
