import 'reflect-metadata';
import {
  Container,
  Injectable,
  isInjectable,
  UserRepository,
  UserService,
  UserController,
} from '@stage4/day4-mini-di-container';

describe('Day 4~5 — 미니 DI 컨테이너', () => {
  describe('@Injectable / isInjectable', () => {
    it('@Injectable() 이 붙은 클래스는 isInjectable=true 다', () => {
      expect(isInjectable(UserRepository)).toBe(true);
      expect(isInjectable(UserService)).toBe(true);
      expect(isInjectable(UserController)).toBe(true);
    });

    it('데코레이터가 없는 클래스는 isInjectable=false 다', () => {
      class Plain {}
      expect(isInjectable(Plain)).toBe(false);
    });
  });

  describe('Container.resolve — 의존성 주입', () => {
    let container: Container;
    beforeEach(() => {
      container = new Container();
    });

    it('의존성 없는 클래스를 생성한다', () => {
      const repo = container.resolve(UserRepository);
      expect(repo).toBeInstanceOf(UserRepository);
      expect(repo.findAll()).toEqual(['alice', 'bob']);
    });

    it('3단 의존성 체인을 재귀적으로 주입한다 (Repo ← Service ← Controller)', () => {
      const controller = container.resolve(UserController);
      expect(controller).toBeInstanceOf(UserController);
      // 최상위 컨트롤러가 최하위 리포지토리까지 관통해 동작해야 한다.
      expect(controller.getUsers()).toEqual(['alice', 'bob']);
    });

    it('@Injectable 이 아닌 클래스를 resolve 하면 에러를 던진다', () => {
      class NotInjectable {}
      expect(() => container.resolve(NotInjectable)).toThrow();
    });
  });

  describe('싱글턴 캐싱', () => {
    let container: Container;
    beforeEach(() => {
      container = new Container();
    });

    it('같은 클래스를 두 번 resolve 하면 동일 인스턴스를 반환한다', () => {
      const a = container.resolve(UserService);
      const b = container.resolve(UserService);
      expect(a).toBe(b);
    });

    it('의존성도 싱글턴으로 공유된다', () => {
      // Service 를 직접 resolve 한 것과, Controller 를 통해 주입된 Service 가
      // 같은 인스턴스여야 한다.
      const service = container.resolve(UserService);
      const controller = container.resolve(UserController);
      expect(controller.getService()).toBe(service);
    });

    it('resolve 후 has 는 true, clear 후에는 false 다', () => {
      expect(container.has(UserRepository)).toBe(false);
      container.resolve(UserRepository);
      expect(container.has(UserRepository)).toBe(true);
      container.clear();
      expect(container.has(UserRepository)).toBe(false);
    });
  });
});
