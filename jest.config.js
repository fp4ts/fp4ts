module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  roots: [
    '<rootDir>/packages/cats/core/src',
    '<rootDir>/packages/cats/free/src',
    '<rootDir>/packages/core/src',
    '<rootDir>/packages/effect/core/src',
    '<rootDir>/packages/effect/kernel/src',
    '<rootDir>/packages/effect/std/src',
  ],
  testEnvironment: 'node',
};
