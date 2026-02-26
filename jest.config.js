module.exports = {
  collectCoverageFrom: ['src/**/*.service.ts', 'src/**/*.controller.ts'],
  coverageDirectory: './coverage',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^generated/(.*)$': '<rootDir>/generated/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
