import 'reflect-metadata';
import {
  Component,
  isComponent,
  Channel,
  getChannel,
  Retry,
  HubContainer,
  SensorDriver,
  TelemetryCollector,
  DashboardService,
} from '@stage4/review-telemetry-hub';

describe('복습 — 스테이지 4 종합: IoT 텔레메트리 허브', () => {
  describe('@Component / isComponent — 클래스 데코레이터 팩토리 + 마커 조회', () => {
    it('@Component() 가 붙은 도메인 클래스는 isComponent=true 다', () => {
      expect(isComponent(SensorDriver)).toBe(true);
      expect(isComponent(TelemetryCollector)).toBe(true);
      expect(isComponent(DashboardService)).toBe(true);
    });

    it('데코레이터가 없는 클래스는 isComponent=false 다', () => {
      class Bare {}
      expect(isComponent(Bare)).toBe(false);
    });
  });

  describe('@Channel / getChannel — Reflect 메타데이터 심기·읽기', () => {
    it('@Channel 로 심은 채널 이름을 getChannel 로 읽는다', () => {
      @Channel('sensor')
      class Tagged {}
      expect(getChannel(Tagged)).toBe('sensor');
    });

    it('@Channel 이 없는 클래스의 getChannel 은 undefined 다', () => {
      expect(getChannel(TelemetryCollector)).toBeUndefined();
    });
  });

  describe('@Retry — 메서드 데코레이터(descriptor.value 감싸기)', () => {
    it('중간에 실패해도 재시도 안에서 성공하면 그 값을 반환한다', () => {
      class Flaky {
        attempts = 0;
        @Retry(2) // 최초 1회 + 재시도 2회 = 최대 3회
        run(): number {
          this.attempts++;
          if (this.attempts < 3) throw new Error('일시 실패');
          return this.attempts;
        }
      }
      const flaky = new Flaky();
      expect(flaky.run()).toBe(3);
      expect(flaky.attempts).toBe(3);
    });

    it('재시도 횟수를 모두 소진하면 마지막 예외를 던지고 this·인자 바인딩을 유지한다', () => {
      class Always {
        seen: number[] = [];
        @Retry(1) // 최대 2회 시도
        run(x: number): never {
          this.seen.push(x);
          throw new Error('영구 실패');
        }
      }
      const always = new Always();
      expect(() => always.run(7)).toThrow('영구 실패');
      // this.seen 이 채워졌다 = this 바인딩 유지, 인자 7 전달, 총 2회 시도
      expect(always.seen).toEqual([7, 7]);
    });
  });

  describe('HubContainer.resolve — design:paramtypes 기반 재귀 주입', () => {
    let container: HubContainer;
    beforeEach(() => {
      container = new HubContainer();
    });

    it('의존성 없는 컴포넌트를 생성한다', () => {
      const driver = container.resolve(SensorDriver);
      expect(driver).toBeInstanceOf(SensorDriver);
      expect(driver.read()).toEqual([21, 23, 22, 24]);
    });

    it('3단 의존성 체인을 재귀적으로 주입한다 (Driver ← Collector ← Dashboard)', () => {
      const dashboard = container.resolve(DashboardService);
      expect(dashboard).toBeInstanceOf(DashboardService);
      // 최상위 대시보드가 최하위 드라이버까지 관통해 평균을 계산해야 한다.
      expect(dashboard.average()).toBe(22.5);
    });

    it('@Component 가 아닌 클래스를 resolve 하면 에러를 던진다', () => {
      class NotAComponent {}
      expect(() => container.resolve(NotAComponent)).toThrow();
    });
  });

  describe('HubContainer — 싱글턴 캐싱', () => {
    let container: HubContainer;
    beforeEach(() => {
      container = new HubContainer();
    });

    it('같은 컴포넌트를 두 번 resolve 하면 동일 인스턴스를 반환한다', () => {
      const a = container.resolve(TelemetryCollector);
      const b = container.resolve(TelemetryCollector);
      expect(a).toBe(b);
    });

    it('주입된 의존성도 싱글턴으로 공유된다', () => {
      // Collector 를 직접 resolve 한 것과, Dashboard 를 통해 주입된 Collector 가
      // 같은 인스턴스여야 하고, 그 아래 Driver 까지 공유되어야 한다.
      const collector = container.resolve(TelemetryCollector);
      const dashboard = container.resolve(DashboardService);
      expect(dashboard.getCollector()).toBe(collector);
      expect(dashboard.getCollector().getDriver()).toBe(collector.getDriver());
    });

    it('resolve 후 has 는 true, clear 후에는 false 다', () => {
      expect(container.has(SensorDriver)).toBe(false);
      container.resolve(SensorDriver);
      expect(container.has(SensorDriver)).toBe(true);
      container.clear();
      expect(container.has(SensorDriver)).toBe(false);
    });
  });
});
