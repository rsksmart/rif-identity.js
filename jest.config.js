module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: ['default', 'jest-junit'],
  testResultsProcessor: 'jest-junit',
  "globals": {
    "ts-jest": {
      "tsConfig": "./packages/tsconfig.settings.json"
    }
  },
  testTimeout: 15000
};
