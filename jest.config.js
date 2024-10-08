/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  preset: 'ts-jest',
  testRegex: '(/tests/.*|(\\.|/)(test))\\.(j|t)sx?$',
};
