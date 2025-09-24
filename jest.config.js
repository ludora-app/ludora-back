module.exports = {
  collectCoverageFrom: ['**/*.(t|j)s'],
  collectCoverageFrom: ['src/**/*.service.ts', 'src/**/*.controller.ts'],
  coverageDirectory: './coverage',
  coverageDirectory: './coverage',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  rootDir: '.',
  testEnvironment: 'node',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
