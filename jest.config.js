/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  moduleNameMapper: {
    '^../src/(.*).js$': '<rootDir>/src/$1.ts',
    '^./mdict.js$': '<rootDir>/src/mdict.ts',
    '^./mdict-base.js$': '<rootDir>/src/mdict-base.ts',
    '^./mdx.js$': '<rootDir>/src/mdx.ts',
    '^./lzo1x.js$': '<rootDir>/src/lzo1x.ts',
    '^./lzo1x-wrapper.js$': '<rootDir>/src/lzo1x-wrapper.ts',
    '^./measure-util.js$': '<rootDir>/src/measure-util.ts',
    '^./utils.js$': '<rootDir>/src/utils.ts',
    '^./ripemd128.js$': '<rootDir>/src/ripemd128.ts',
    '^./index.js$': '<rootDir>/src/index.ts',
    '^./mdx.js$': '<rootDir>/src/mdx.ts',
    '^./mdd.js$': '<rootDir>/src/mdd.ts',

  },
  preset: 'ts-jest',
  testRegex: '/test/.*\\.test\\.tsx?$',
};
