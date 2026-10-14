// Unit tests live in test/ and never touch the database:
// every repository is replaced by a test double.
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/test/support/seedFaker.ts'],
  clearMocks: true,
};
