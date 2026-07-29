import { Frozen, Tagged, getTag } from '@stage4/day1-class-decorator';

describe('Day 1 — 클래스 데코레이터', () => {
  describe('@Frozen', () => {
    it('적용된 클래스의 prototype 을 동결한다 (메서드 교체 불가)', () => {
      @Frozen
      class Service {
        hello(): string {
          return 'hi';
        }
      }

      // 동결되었으므로 프로토타입 메서드를 덮어써도 반영되지 않는다.
      // (strict 모드 밖에서는 조용히 무시된다.)
      expect(Object.isFrozen(Service.prototype)).toBe(true);
      expect(Object.isFrozen(Service)).toBe(true);
      expect(new Service().hello()).toBe('hi');
    });

    it('데코레이터는 클래스 자체 동작을 망가뜨리지 않는다', () => {
      @Frozen
      class Counter {
        value = 0;
        inc(): void {
          this.value += 1;
        }
      }
      const c = new Counter();
      c.inc();
      c.inc();
      // 인스턴스 프로퍼티는 동결 대상이 아니므로 정상 동작해야 한다.
      expect(c.value).toBe(2);
    });
  });

  describe('@Tagged 팩토리 + getTag', () => {
    it('팩토리로 심은 태그를 getTag 로 읽을 수 있다', () => {
      @Tagged('users')
      class UserController {}

      expect(getTag(UserController)).toBe('users');
    });

    it('서로 다른 인자는 서로 다른 태그를 남긴다', () => {
      @Tagged('a')
      class A {}
      @Tagged('b')
      class B {}

      expect(getTag(A)).toBe('a');
      expect(getTag(B)).toBe('b');
    });

    it('태그가 없는 클래스는 undefined 를 반환한다', () => {
      class Plain {}
      expect(getTag(Plain)).toBeUndefined();
    });
  });
});
