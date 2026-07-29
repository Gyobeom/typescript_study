import 'reflect-metadata';
import {
  setRole,
  getRole,
  WithRole,
  getParamTypes,
} from '@stage4/day3-metadata';

describe('Day 3 — reflect-metadata', () => {
  describe('setRole / getRole', () => {
    it('심은 메타데이터를 그대로 읽는다', () => {
      class Admin {}
      setRole(Admin, 'admin');
      expect(getRole(Admin)).toBe('admin');
    });

    it('메타데이터가 없으면 undefined 를 반환한다', () => {
      class Guest {}
      expect(getRole(Guest)).toBeUndefined();
    });
  });

  describe('@WithRole 데코레이터', () => {
    it('데코레이터로 심은 role 을 getRole 로 읽을 수 있다', () => {
      @WithRole('manager')
      class Team {}
      expect(getRole(Team)).toBe('manager');
    });
  });

  describe('getParamTypes (design:paramtypes)', () => {
    // 데코레이터가 하나라도 붙어 있어야 컴파일러가 design:paramtypes 를 심는다.
    it('데코레이터가 붙은 클래스의 생성자 파라미터 타입을 읽는다', () => {
      class Engine {}
      class Wheel {}

      @WithRole('car') // 메타데이터 방출을 트리거하기 위한 데코레이터
      class Car {
        constructor(
          public engine: Engine,
          public wheel: Wheel,
        ) {}
      }

      const types = getParamTypes(Car);
      expect(types).toHaveLength(2);
      expect(types[0]).toBe(Engine);
      expect(types[1]).toBe(Wheel);
    });

    it('생성자 파라미터가 없으면 빈 배열을 반환한다', () => {
      @WithRole('empty')
      class NoDeps {}
      expect(getParamTypes(NoDeps)).toEqual([]);
    });

    it('메타데이터가 전혀 없는 클래스도 빈 배열을 반환한다', () => {
      class Plain {}
      expect(getParamTypes(Plain)).toEqual([]);
    });
  });
});
