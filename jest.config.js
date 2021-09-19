module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './packages',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.spec.json',
    },
  },
  roots: [
    '<rootDir>/cats/core/src',
    '<rootDir>/cats/free/src',
    '<rootDir>/core/src',
    '<rootDir>/effect/core/src',
    '<rootDir>/effect/kernel/src',
    '<rootDir>/effect/std/src',
  ],
  testEnvironment: 'node',
};
