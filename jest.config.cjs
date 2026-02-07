/** @type {import('jest').Config} */
const baseProjectConfig = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.json',
                diagnostics: {
                    // ts-jest warning for NodeNext/Node16 hybrid module mode
                    // https://kulshekhar.github.io/ts-jest/docs/getting-started/options/diagnostics
                    ignoreCodes: [151002]
                }
            }
        ]
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    testPathIgnorePatterns: ['/node_modules/'],
    collectCoverageFrom: [
        '<rootDir>/src/**/*.ts',
        '!<rootDir>/src/**/*.d.ts'
    ]
};

module.exports = {
    coverageReporters: ['text', 'lcov'],
    // Tests live at the repository root following Clean Architecture conventions:
    // test/modules/<module>/** and test/shared/**
    projects: [
        {
            ...baseProjectConfig,
            displayName: 'auth',
            testMatch: [
                '<rootDir>/test/modules/auth/**/*.test.ts',
                '<rootDir>/test/modules/auth/**/*.spec.ts'
            ],
            collectCoverageFrom: [
                '<rootDir>/src/modules/auth/**/*.ts',
                '!<rootDir>/src/modules/auth/**/*.d.ts'
            ],
            coverageDirectory: '<rootDir>/coverage/auth'
        },
        {
            ...baseProjectConfig,
            displayName: 'subscriptions',
            testMatch: [
                '<rootDir>/test/modules/subscriptions/**/*.test.ts',
                '<rootDir>/test/modules/subscriptions/**/*.spec.ts'
            ],
            collectCoverageFrom: [
                '<rootDir>/src/modules/subscriptions/**/*.ts',
                '!<rootDir>/src/modules/subscriptions/**/*.d.ts'
            ],
            coverageDirectory: '<rootDir>/coverage/subscriptions'
        },
        {
            ...baseProjectConfig,
            displayName: 'user',
            testMatch: [
                '<rootDir>/test/modules/user/**/*.test.ts',
                '<rootDir>/test/modules/user/**/*.spec.ts'
            ],
            collectCoverageFrom: [
                '<rootDir>/src/modules/user/**/*.ts',
                '!<rootDir>/src/modules/user/**/*.d.ts'
            ],
            coverageDirectory: '<rootDir>/coverage/user'
        },
        {
            ...baseProjectConfig,
            displayName: 'identity',
            testMatch: [
                '<rootDir>/test/modules/identity/**/*.test.ts',
                '<rootDir>/test/modules/identity/**/*.spec.ts'
            ],
            collectCoverageFrom: [
                '<rootDir>/src/modules/identity/**/*.ts',
                '!<rootDir>/src/modules/identity/**/*.d.ts'
            ],
            coverageDirectory: '<rootDir>/coverage/identity'
        },
        {
            ...baseProjectConfig,
            displayName: 'shared',
            testMatch: [
                '<rootDir>/test/shared/**/*.test.ts',
                '<rootDir>/test/shared/**/*.spec.ts'
            ],
            collectCoverageFrom: [
                '<rootDir>/src/shared/**/*.ts',
                '!<rootDir>/src/shared/**/*.d.ts'
            ],
            coverageDirectory: '<rootDir>/coverage/shared'
        }
    ]
};


