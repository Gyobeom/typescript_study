// Day 4~5 — 미니 DI(의존성 주입) 컨테이너
//
// 지난 3일의 재료를 모아 NestJS 의 IoC 컨테이너 축소판을 직접 만든다.
//   - @Injectable()  : "이 클래스는 컨테이너가 생성·관리해도 된다"는 표시(마커 데코레이터)
//   - Container.resolve(Cls) :
//       1) Cls 의 생성자 파라미터 타입 목록(design:paramtypes)을 읽고
//       2) 각 의존성을 "재귀적으로" resolve 하여 인스턴스를 만든 뒤
//       3) new Cls(...deps) 로 주입 생성한다.
//       4) 한 번 만든 인스턴스는 싱글턴으로 캐싱해 재사용한다.
//
// 예제 도메인(3단 주입): UserRepository ← UserService ← UserController
//
// ※ reflect-metadata 는 최상단에서 import.
import 'reflect-metadata';

// @Injectable 이 심을 메타데이터 키.
const INJECTABLE_KEY = 'stage4:injectable';

// ─────────────────────────────────────────────────────────────
// 1) @Injectable() : 마커 데코레이터 팩토리  [★ 이 함수는 완성되어 제공된다]
//    클래스에 "주입 가능" 메타데이터(true)를 심는다.
//    (인자를 받지 않지만 NestJS 관례대로 호출형 @Injectable() 로 쓴다.)
//
//    ※ 왜 미리 구현해 두었나:
//      아래 예제 도메인 클래스들이 로드되는 즉시 이 데코레이터가 "호출"된다
//      (데코레이터 팩토리는 클래스 정의 시점에 실행됨). 여기서 throw 하면
//      파일 자체를 열 수 없으므로, 이 마커만 완성형으로 제공한다.
//      또한 이 데코레이터가 붙어야 컴파일러가 design:paramtypes 를 방출한다.
//      → 학습자가 채울 핵심은 아래 isInjectable 과 Container 다.
// ─────────────────────────────────────────────────────────────
export function Injectable(): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(INJECTABLE_KEY, true, target);
  };
}

// 주어진 클래스가 @Injectable() 로 표시되었는지 확인한다.
export function isInjectable(target: Function): boolean {
  // 힌트: Reflect.getMetadata(INJECTABLE_KEY, target) === true
  throw new Error('TODO: INJECTABLE_KEY 메타데이터 존재 여부를 반환하라');
}

// 의존성 없이 사용할 수 있는 생성자 타입.
export type Constructor<T = unknown> = new (...args: any[]) => T;

// ─────────────────────────────────────────────────────────────
// 2) Container : 미니 IoC 컨테이너
// ─────────────────────────────────────────────────────────────
export class Container {
  // 이미 만든 인스턴스를 담는 싱글턴 캐시. 키는 클래스(생성자)다.
  private readonly singletons = new Map<Constructor, unknown>();

  // resolve(Cls):
  //   - 캐시에 있으면 그대로 반환(싱글턴)
  //   - @Injectable 이 아니면 에러
  //   - design:paramtypes 로 의존성 타입을 읽어 각각 재귀 resolve
  //   - new Cls(...deps) 로 생성 후 캐시에 저장하고 반환
  resolve<T>(target: Constructor<T>): T {
    // 힌트(구현 순서):
    //   1) if (this.singletons.has(target)) return this.singletons.get(target) as T;
    //   2) if (!isInjectable(target)) throw new Error(`${target.name} 은 @Injectable 이 아닙니다`);
    //   3) const paramTypes: Function[] = Reflect.getMetadata('design:paramtypes', target) ?? [];
    //   4) const deps = paramTypes.map((dep) => this.resolve(dep as Constructor));
    //   5) const instance = new target(...deps);
    //   6) this.singletons.set(target, instance);
    //   7) return instance;
    throw new Error('TODO: 의존성을 재귀 주입하여 인스턴스를 생성·캐싱하라');
  }

  // 이 클래스가 이미 인스턴스를 갖고 있는지(캐시 적중 여부) 확인 — 싱글턴 검증용.
  has(target: Constructor): boolean {
    // 힌트: this.singletons.has(target)
    throw new Error('TODO: 캐시 보유 여부를 반환하라');
  }

  // 캐시를 비운다(테스트 격리·재구성용).
  clear(): void {
    // 힌트: this.singletons.clear()
    throw new Error('TODO: 싱글턴 캐시를 비워라');
  }
}

// ─────────────────────────────────────────────────────────────
// 3) 예제 도메인 — 3단 의존성 주입 체인
//    UserRepository(의존성 없음) ← UserService(Repo 주입) ← UserController(Service 주입)
//    각 클래스에 @Injectable() 을 붙여야 컨테이너가 주입할 수 있다.
// ─────────────────────────────────────────────────────────────

@Injectable()
export class UserRepository {
  private readonly users = ['alice', 'bob'];

  findAll(): string[] {
    return [...this.users];
  }
}

@Injectable()
export class UserService {
  // 힌트: 생성자에서 UserRepository 를 주입받는다.
  //       컨테이너가 design:paramtypes 로 이 타입을 읽어 자동으로 넣어준다.
  constructor(private readonly repo: UserRepository) {}

  listUsers(): string[] {
    return this.repo.findAll();
  }
}

@Injectable()
export class UserController {
  // 힌트: 생성자에서 UserService 를 주입받는다.
  constructor(private readonly service: UserService) {}

  getUsers(): string[] {
    return this.service.listUsers();
  }

  // 주입된 service 인스턴스를 노출 — 싱글턴 공유 검증에 사용한다.
  getService(): UserService {
    return this.service;
  }
}
