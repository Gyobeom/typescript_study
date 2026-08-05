// 복습(인출 연습) — 스테이지 4 종합
//
// 이 문제에는 구현 힌트가 없다. 요구사항 명세만 읽고, 그 주에 배운
// 데코레이터·메타데이터·DI 개념을 스스로 꺼내 써서
// "IoT 텔레메트리 허브" 도메인을 완성하라.
//
// 커버해야 할 개념(전부):
//   - 클래스 데코레이터 팩토리 (@Component())
//   - 메서드 데코레이터 (descriptor.value 감싸기 — @Retry)
//   - Reflect 메타데이터 심기·읽기 (@Channel / getChannel)
//   - design:paramtypes 로 생성자 의존성 타입 읽기
//   - 재귀 resolve + 싱글턴 캐싱을 갖춘 미니 DI 컨테이너 (HubContainer)
//
// 도메인(3단 주입 체인):
//   SensorDriver  ← TelemetryCollector  ← DashboardService
//   (드라이버가 raw 값을 읽고, 컬렉터가 모으고, 대시보드가 요약한다)
//
// ※ reflect-metadata 는 반드시 파일 최상단에서 import.
import 'reflect-metadata';

// ─────────────────────────────────────────────────────────────
// 메타데이터 키 (수정 금지)
// ─────────────────────────────────────────────────────────────
const COMPONENT_KEY = 'stage4:review:component';
const CHANNEL_KEY = 'stage4:review:channel';

// ─────────────────────────────────────────────────────────────
// 1) @Component() : 마커 클래스 데코레이터 팩토리  [★ 완성되어 제공됨]
//    "이 클래스는 허브 컨테이너가 생성·관리해도 된다"는 표시로,
//    클래스(생성자)에 COMPONENT_KEY 메타데이터(true)를 심는다.
//
//    ※ 왜 미리 구현해 두었나:
//      아래 예제 도메인 클래스들이 로드되는 즉시 이 팩토리가 "호출"된다
//      (데코레이터 팩토리는 클래스 정의 시점에 실행됨). 여기서 throw 하면
//      파일 자체를 열 수 없으므로, 이 마커만 동작하는 최소형으로 제공한다.
//      또한 이 데코레이터가 붙어야 컴파일러가 design:paramtypes 를 방출한다.
//      → 학습자가 채울 핵심은 "읽는 쪽"(isComponent·컨테이너·메타데이터 조회)이다.
// ─────────────────────────────────────────────────────────────
export function Component(): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(COMPONENT_KEY, true, target);
  };
}

// 주어진 클래스가 @Component() 로 표시되었는지 확인한다.
// (COMPONENT_KEY 메타데이터가 true 인지 여부를 boolean 으로 반환.)
export function isComponent(target: Function): boolean {
  throw new Error('TODO: COMPONENT_KEY 메타데이터가 true 인지 반환하라');
}

// ─────────────────────────────────────────────────────────────
// 2) @Channel(name) : 메타데이터를 심는 클래스 데코레이터 팩토리
//    클래스에 "이 컴포넌트가 붙는 채널 이름"을 CHANNEL_KEY 로 심는다.
//    (NestJS 의 @Controller('users') 가 라우트 경로를 심는 것과 같은 발상.)
// ─────────────────────────────────────────────────────────────
export function Channel(name: string): ClassDecorator {
  throw new Error('TODO: name 을 CHANNEL_KEY 메타데이터로 심는 데코레이터를 반환하라');
}

// @Channel 로 심긴 채널 이름을 읽는다. 없으면 undefined.
export function getChannel(target: Function): string | undefined {
  throw new Error('TODO: target 의 CHANNEL_KEY 메타데이터를 읽어 반환하라');
}

// ─────────────────────────────────────────────────────────────
// 3) @Retry(times) : 메서드 데코레이터 팩토리
//    메서드가 예외를 던지면 최대 times 번까지 "재시도"한다.
//    - 원본 메서드를 보관하고 descriptor.value 를 감싼 새 함수로 교체한다.
//    - 새 함수는 원본을 apply(this, args) 로 호출하되, 예외가 나면 다시 시도한다.
//    - 총 시도 횟수는 (1 + times) 회다. 즉 @Retry(2) 면 최초 1회 + 재시도 2회 = 최대 3회 호출.
//    - 마지막 시도까지 실패하면 마지막 예외를 그대로 던진다.
//    - 성공하면 그 반환값을 돌려준다.
//    - this 바인딩과 인자 전달을 유지해야 한다.
// ─────────────────────────────────────────────────────────────
export function Retry(times: number): MethodDecorator {
  throw new Error('TODO: 예외 시 최대 times 번 재시도하도록 descriptor.value 를 감싸라');
}

// 의존성 없이 사용할 수 있는 생성자 타입.
export type Constructor<T = unknown> = new (...args: any[]) => T;

// ─────────────────────────────────────────────────────────────
// 4) HubContainer : 미니 IoC 컨테이너
//    resolve(Cls):
//      - 캐시에 있으면 그대로 반환(싱글턴)
//      - @Component 가 아니면 에러를 던진다
//      - design:paramtypes 로 생성자 의존성 타입 목록을 읽어 각각 재귀 resolve
//      - new Cls(...deps) 로 생성 후 캐시에 저장하고 반환
// ─────────────────────────────────────────────────────────────
export class HubContainer {
  private readonly singletons = new Map<Constructor, unknown>();

  resolve<T>(target: Constructor<T>): T {
    throw new Error('TODO: 의존성을 재귀 주입하여 인스턴스를 생성·캐싱하라');
  }

  // 이 클래스가 이미 인스턴스를 갖고 있는지(캐시 적중 여부) 확인.
  has(target: Constructor): boolean {
    throw new Error('TODO: 캐시 보유 여부를 반환하라');
  }

  // 캐시를 비운다(테스트 격리·재구성용).
  clear(): void {
    throw new Error('TODO: 싱글턴 캐시를 비워라');
  }
}

// ─────────────────────────────────────────────────────────────
// 5) 예제 도메인 — 3단 의존성 주입 체인
//    각 클래스에 @Component() 가 붙어야 컨테이너가 주입할 수 있고,
//    컴파일러가 design:paramtypes 를 방출한다.
//    (여기의 @Component() 는 완성형 마커라 로드 시점에 안전하게 실행된다.)
// ─────────────────────────────────────────────────────────────

@Component()
export class SensorDriver {
  // 고정된 raw 측정값들(테스트 재현성을 위해 상수).
  read(): number[] {
    return [21, 23, 22, 24];
  }
}

@Component()
export class TelemetryCollector {
  // 생성자에서 SensorDriver 를 주입받는다.
  constructor(private readonly driver: SensorDriver) {}

  // 드라이버가 읽은 raw 값을 모아서 그대로 돌려준다.
  collect(): number[] {
    return this.driver.read();
  }

  // 주입된 driver 인스턴스를 노출 — 싱글턴 공유 검증에 사용한다.
  getDriver(): SensorDriver {
    return this.driver;
  }
}

@Component()
export class DashboardService {
  // 생성자에서 TelemetryCollector 를 주입받는다.
  constructor(private readonly collector: TelemetryCollector) {}

  // 수집된 값들의 평균을 반환한다(요약 지표).
  average(): number {
    const values = this.collector.collect();
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  // 주입된 collector 인스턴스를 노출 — 싱글턴 공유 검증에 사용한다.
  getCollector(): TelemetryCollector {
    return this.collector;
  }
}
