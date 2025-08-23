module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': [
            "@swc/jest",
            {
                jsc: {
                    parser: {
                        tsx: false,
                        syntax: "typescript",
                        decorators: true
                    }
                },
            },
        ],
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!**/*.d.ts',
    ],
    testPathIgnorePatterns: [ '/lib/', '/node_modules/', '/dist/' ],
    moduleNameMapper: {
        '^@errors/(.*)$': '<rootDir>/src/errors/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@providers/(.*)$': '<rootDir>/src/providers/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@reports/(.*)$': '<rootDir>/src/modules/reports/$1',
        '^@symlinks/(.*)$': '<rootDir>/src/modules/symlinks/$1',
        '^@configuration/(.*)$': '<rootDir>/src/configuration/$1'
    },
};
