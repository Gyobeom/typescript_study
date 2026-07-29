// Day 1 — 클래스 데코레이터 (모범 답안)

export function Frozen(constructor: Function): void {
  // prototype 을 얼려 인스턴스 메서드 교체를 막고,
  // constructor 자신도 얼려 static 멤버 교체를 막는다.
  Object.freeze(constructor.prototype);
  Object.freeze(constructor);
}

export function Tagged(name: string): ClassDecorator {
  // 바깥 함수(팩토리)는 name 을 클로저로 붙잡고,
  // 안쪽에서 실제 클래스 데코레이터를 반환한다.
  return (constructor: Function): void => {
    (constructor as any).__tag__ = name;
  };
}

export function getTag(target: Function): string | undefined {
  return (target as any).__tag__;
}
