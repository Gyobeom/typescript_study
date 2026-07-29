import {
  LogExecution,
  Memoize,
  executionLog,
} from '@stage4/day2-method-decorator';

describe('Day 2 — 메서드 데코레이터', () => {
  beforeEach(() => {
    // 전역 로그를 매 테스트마다 비운다.
    executionLog.length = 0;
  });

  describe('@LogExecution', () => {
    it('메서드 호출 시 executionLog 에 기록을 남긴다', () => {
      class Calc {
        @LogExecution
        add(a: number, b: number): number {
          return a + b;
        }
      }
      const c = new Calc();
      c.add(1, 2);

      expect(executionLog).toContain('add called');
    });

    it('원본 반환값과 인자 전달을 그대로 유지한다', () => {
      class Calc {
        @LogExecution
        mul(a: number, b: number): number {
          return a * b;
        }
      }
      const c = new Calc();
      expect(c.mul(3, 4)).toBe(12);
    });

    it('여러 번 호출하면 그 횟수만큼 기록된다', () => {
      class Svc {
        @LogExecution
        ping(): string {
          return 'pong';
        }
      }
      const s = new Svc();
      s.ping();
      s.ping();
      s.ping();
      expect(executionLog.filter((l) => l === 'ping called')).toHaveLength(3);
    });
  });

  describe('@Memoize', () => {
    it('같은 인자로 재호출하면 원본을 다시 실행하지 않는다', () => {
      let calls = 0;
      class Heavy {
        @Memoize
        square(n: number): number {
          calls += 1;
          return n * n;
        }
      }
      const h = new Heavy();
      expect(h.square(5)).toBe(25);
      expect(h.square(5)).toBe(25);
      expect(calls).toBe(1); // 두 번째 호출은 캐시에서 나온다
    });

    it('다른 인자는 각각 새로 계산한다', () => {
      let calls = 0;
      class Heavy {
        @Memoize
        square(n: number): number {
          calls += 1;
          return n * n;
        }
      }
      const h = new Heavy();
      expect(h.square(2)).toBe(4);
      expect(h.square(3)).toBe(9);
      expect(calls).toBe(2);
    });

    it('인스턴스마다 캐시가 분리된다', () => {
      let calls = 0;
      class Heavy {
        @Memoize
        square(n: number): number {
          calls += 1;
          return n * n;
        }
      }
      const a = new Heavy();
      const b = new Heavy();
      a.square(4);
      b.square(4); // 다른 인스턴스이므로 캐시 미적중 → 다시 계산
      expect(calls).toBe(2);
    });
  });
});
