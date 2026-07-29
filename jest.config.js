// TARGET 환경변수로 exercises / solutions 중 어느 쪽을 대상으로 테스트할지 전환한다.
// 기본값은 exercises (스켈레톤 대상). check:*:answer 스크립트가 TARGET=solutions 로 실행한다.
const target = process.env.TARGET === 'solutions' ? 'solutions' : 'exercises';

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/stages/**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@stage1/(.*)$': '<rootDir>/stages/stage1-class-basics/' + target + '/$1',
    '^@stage2/(.*)$': '<rootDir>/stages/stage2-contracts/' + target + '/$1',
    '^@stage3/(.*)$': '<rootDir>/stages/stage3-generics/' + target + '/$1',
    '^@stage4/(.*)$': '<rootDir>/stages/stage4-decorators-di/' + target + '/$1',
    '^@stage5/(.*)$': '<rootDir>/stages/stage5-nestjs-project/' + target + '/$1',
  },
};
