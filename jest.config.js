module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './packages',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '.spec.ts$',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.build.json',
    },
  },
  roots: [
    '<rootDir>/cats/__tests__',
    '<rootDir>/cats/core/src',
    '<rootDir>/cats/free/src',
    '<rootDir>/cats/laws/src',
    '<rootDir>/core/src',
    '<rootDir>/effect/__tests__',
    '<rootDir>/effect/core/src',
    '<rootDir>/effect/kernel/src',
    '<rootDir>/effect/laws/src',
    '<rootDir>/effect/std/src',
    '<rootDir>/http/__tests__',
    '<rootDir>/schema/__tests__',
    '<rootDir>/schema/core/src',
    '<rootDir>/stream/__tests__',
    '<rootDir>/stream/core/src',
    '<rootDir>/examples/fp-to-the-max',
    '<rootDir>/examples/todo-api',
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../jest-setup.js'],
};
