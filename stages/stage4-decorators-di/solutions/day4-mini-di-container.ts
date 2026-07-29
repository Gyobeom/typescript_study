// Day 4~5 — 미니 DI 컨테이너 (모범 답안)
import 'reflect-metadata';

const INJECTABLE_KEY = 'stage4:injectable';

export function Injectable(): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(INJECTABLE_KEY, true, target);
  };
}

export function isInjectable(target: Function): boolean {
  return Reflect.getMetadata(INJECTABLE_KEY, target) === true;
}

export type Constructor<T = unknown> = new (...args: any[]) => T;

export class Container {
  private readonly singletons = new Map<Constructor, unknown>();

  resolve<T>(target: Constructor<T>): T {
    // 1) 싱글턴 캐시 적중 시 즉시 반환
    if (this.singletons.has(target)) {
      return this.singletons.get(target) as T;
    }

    // 2) @Injectable 로 표시되지 않은 클래스는 주입 불가
    if (!isInjectable(target)) {
      throw new Error(`${target.name} 은(는) @Injectable() 로 표시되지 않았습니다`);
    }

    // 3) 생성자 파라미터 타입(의존성) 목록을 읽는다
    const paramTypes: Function[] =
      Reflect.getMetadata('design:paramtypes', target) ?? [];

    // 4) 각 의존성을 재귀적으로 resolve — 트리 형태의 주입이 여기서 일어난다
    const deps = paramTypes.map((dep) => this.resolve(dep as Constructor));

    // 5) 의존성을 주입하여 인스턴스 생성
    const instance = new target(...deps);

    // 6) 싱글턴으로 캐싱
    this.singletons.set(target, instance);

    // 7) 반환
    return instance;
  }

  has(target: Constructor): boolean {
    return this.singletons.has(target);
  }

  clear(): void {
    this.singletons.clear();
  }
}

@Injectable()
export class UserRepository {
  private readonly users = ['alice', 'bob'];

  findAll(): string[] {
    return [...this.users];
  }
}

@Injectable()
export class UserService {
  constructor(private readonly repo: UserRepository) {}

  listUsers(): string[] {
    return this.repo.findAll();
  }
}

@Injectable()
export class UserController {
  constructor(private readonly service: UserService) {}

  getUsers(): string[] {
    return this.service.listUsers();
  }

  getService(): UserService {
    return this.service;
  }
}
