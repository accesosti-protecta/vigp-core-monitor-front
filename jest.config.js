const { createCjsPreset } = require('jest-preset-angular/presets');

module.exports = {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/e2e/'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
  },
  // El umbral aplica a lo que la estrategia de pruebas dice cubrir:
  // mappers, guards, interceptores y store. Las vistas van a Playwright.
  collectCoverageFrom: [
    'src/app/**/*.mapper.ts',
    'src/app/core/auth/**/*.ts',
    'src/app/core/errors/**/*.ts',
    'src/app/core/http/**/*.ts',
    'src/app/features/**/*.store.ts',
    '!src/app/**/*.spec.ts',
  ],
  coverageThreshold: {
    global: { statements: 60, branches: 55, functions: 55, lines: 60 },
  },
};
