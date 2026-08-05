// 복습(인출 연습) — 스테이지 4 종합 (모범 답안)
// 도메인: IoT 텔레메트리 허브 (SensorDriver ← TelemetryCollector ← DashboardService)
import 'reflect-metadata';

const COMPONENT_KEY = 'stage4:review:component';
const CHANNEL_KEY = 'stage4:review:channel';

// 1) @Component() : 마커 클래스 데코레이터 팩토리
export function Component(): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(COMPONENT_KEY, true, target);
  };
}

export function isComponent(target: Function): boolean {
  return Reflect.getMetadata(COMPONENT_KEY, target) === true;
}

// 2) @Channel(name) : 메타데이터를 심는 클래스 데코레이터 팩토리
export function Channel(name: string): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(CHANNEL_KEY, name, target);
  };
}

export function getChannel(target: Function): string | undefined {
  return Reflect.getMetadata(CHANNEL_KEY, target);
}

// 3) @Retry(times) : 메서드 데코레이터 팩토리 (descriptor.value 감싸기)
export function Retry(times: number): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      let lastError: unknown;
      // 최초 1회 + 재시도 times 회 = 최대 (1 + times) 회 시도
      for (let attempt = 0; attempt <= times; attempt++) {
        try {
          return original.apply(this, args);
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError;
    };
    return descriptor;
  };
}

export type Constructor<T = unknown> = new (...args: any[]) => T;

// 4) HubContainer : 미니 IoC 컨테이너
export class HubContainer {
  private readonly singletons = new Map<Constructor, unknown>();

  resolve<T>(target: Constructor<T>): T {
    // 1) 싱글턴 캐시 적중 시 즉시 반환
    if (this.singletons.has(target)) {
      return this.singletons.get(target) as T;
    }

    // 2) @Component 로 표시되지 않은 클래스는 주입 불가
    if (!isComponent(target)) {
      throw new Error(`${target.name} 은(는) @Component() 로 표시되지 않았습니다`);
    }

    // 3) 생성자 파라미터 타입(의존성) 목록을 읽는다
    const paramTypes: Function[] =
      Reflect.getMetadata('design:paramtypes', target) ?? [];

    // 4) 각 의존성을 재귀적으로 resolve
    const deps = paramTypes.map((dep) => this.resolve(dep as Constructor));

    // 5) 의존성을 주입하여 인스턴스 생성
    const instance = new target(...deps);

    // 6) 싱글턴 캐싱 후 7) 반환
    this.singletons.set(target, instance);
    return instance;
  }

  has(target: Constructor): boolean {
    return this.singletons.has(target);
  }

  clear(): void {
    this.singletons.clear();
  }
}

// 5) 예제 도메인 — 3단 의존성 주입 체인
@Component()
export class SensorDriver {
  read(): number[] {
    return [21, 23, 22, 24];
  }
}

@Component()
export class TelemetryCollector {
  constructor(private readonly driver: SensorDriver) {}

  collect(): number[] {
    return this.driver.read();
  }

  getDriver(): SensorDriver {
    return this.driver;
  }
}

@Component()
export class DashboardService {
  constructor(private readonly collector: TelemetryCollector) {}

  average(): number {
    const values = this.collector.collect();
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  getCollector(): TelemetryCollector {
    return this.collector;
  }
}
