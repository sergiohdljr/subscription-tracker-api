/** @type {import('jest').Config} */
const baseProjectConfig = {
  testEnvironment: 'node',
  // Use @swc/jest for faster compilation (much faster than ts-jest)
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: false,
            dynamicImport: true,
          },
          target: 'es2022',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  // Cache configuration for faster subsequent runs
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Auto-clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/**/*.d.ts'],
};

module.exports = {
  // Tests live at the repository root following Clean Architecture conventions:
  // test/modules/<module>/** and test/shared/**
  // Performance optimizations
  maxWorkers: '50%',
  // Timeout for tests (5s should be enough for unit tests)
  testTimeout: 5000,
  coverageReporters: ['text', 'lcov'],
  projects: [
    {
      ...baseProjectConfig,
      displayName: 'auth',
      testMatch: [
        '<rootDir>/test/modules/auth/**/*.test.ts',
        '<rootDir>/test/modules/auth/**/*.spec.ts',
      ],
      collectCoverageFrom: [
        '<rootDir>/src/modules/auth/**/*.ts',
        '!<rootDir>/src/modules/auth/**/*.d.ts',
      ],
      coverageDirectory: '<rootDir>/coverage/auth',
    },
    {
      ...baseProjectConfig,
      displayName: 'subscriptions',
      testMatch: [
        '<rootDir>/test/modules/subscriptions/**/*.test.ts',
        '<rootDir>/test/modules/subscriptions/**/*.spec.ts',
      ],
      collectCoverageFrom: [
        '<rootDir>/src/modules/subscriptions/**/*.ts',
        '!<rootDir>/src/modules/subscriptions/**/*.d.ts',
      ],
      coverageDirectory: '<rootDir>/coverage/subscriptions',
    },
    {
      ...baseProjectConfig,
      displayName: 'user',
      testMatch: [
        '<rootDir>/test/modules/user/**/*.test.ts',
        '<rootDir>/test/modules/user/**/*.spec.ts',
      ],
      collectCoverageFrom: [
        '<rootDir>/src/modules/user/**/*.ts',
        '!<rootDir>/src/modules/user/**/*.d.ts',
      ],
      coverageDirectory: '<rootDir>/coverage/user',
    },
    {
      ...baseProjectConfig,
      displayName: 'identity',
      testMatch: [
        '<rootDir>/test/modules/identity/**/*.test.ts',
        '<rootDir>/test/modules/identity/**/*.spec.ts',
      ],
      collectCoverageFrom: [
        '<rootDir>/src/modules/identity/**/*.ts',
        '!<rootDir>/src/modules/identity/**/*.d.ts',
      ],
      coverageDirectory: '<rootDir>/coverage/identity',
    },
    {
      ...baseProjectConfig,
      displayName: 'shared',
      testMatch: ['<rootDir>/test/shared/**/*.test.ts', '<rootDir>/test/shared/**/*.spec.ts'],
      collectCoverageFrom: ['<rootDir>/src/shared/**/*.ts', '!<rootDir>/src/shared/**/*.d.ts'],
      coverageDirectory: '<rootDir>/coverage/shared',
    },
  ],
};
