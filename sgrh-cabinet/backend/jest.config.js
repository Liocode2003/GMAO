/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/index.ts',
    '!src/jobs/**',
    '!src/services/reportService.ts',
    '!src/controllers/importExportController.ts',
    '!src/services/emailService.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 63,
      lines: 75,
      statements: 73,
    },
  },
  moduleNameMapper: {
    '^../config/database$': '<rootDir>/src/__tests__/__mocks__/database.ts',
    '^../../config/database$': '<rootDir>/src/__tests__/__mocks__/database.ts',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'commonjs',
      },
    },
  },
};

module.exports = config;
