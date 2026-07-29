// Day 1 — 클래스 데코레이터
//
// 데코레이터는 결국 "무언가(클래스/메서드/…)를 받아 부수효과를 내거나 바꾸는 함수"다.
// 클래스 데코레이터는 대상 클래스의 "생성자 함수"를 유일한 인자로 받는다.
//
// 목표:
//   1) @Frozen         — 데코레이터가 함수임을 체감 (클래스를 받아 Object.freeze 를 건다)
//   2) @Tagged('name') — 데코레이터 "팩토리" (인자를 받아 데코레이터를 반환하는 함수)
//   3) getTag()        — 팩토리가 심은 정보를 다시 읽어오기

// ─────────────────────────────────────────────────────────────
// 1) @Frozen : 클래스 데코레이터
//    적용된 클래스의 prototype 을 동결(Object.freeze)하여,
//    인스턴스 메서드를 런타임에 덮어쓰지 못하게 만든다.
//
//    클래스 데코레이터의 시그니처: (constructor: Function) => void
// ─────────────────────────────────────────────────────────────
export function Frozen(constructor: Function): void {
  // 힌트: Object.freeze 를 constructor.prototype 과 constructor 자신에 각각 건다.
  //       메서드는 prototype 에, static 멤버는 constructor 에 있기 때문이다.
  throw new Error('TODO: constructor.prototype 과 constructor 를 Object.freeze 하라');
}

// ─────────────────────────────────────────────────────────────
// 2) @Tagged(name) : 데코레이터 팩토리
//    문자열 인자를 받아 "실제 데코레이터 함수"를 반환한다.
//    반환된 데코레이터는 클래스 생성자에 정적 프로퍼티 __tag__ 를 심는다.
//
//    NestJS 의 @Controller('users') 처럼 "인자를 받는 데코레이터"가 바로 이 팩토리 패턴이다.
// ─────────────────────────────────────────────────────────────
export function Tagged(name: string): ClassDecorator {
  // 힌트: 바깥 함수는 name 을 받고, 안쪽에서 (constructor) => { ... } 데코레이터를 반환한다.
  //       심을 때는 (constructor as any).__tag__ = name 형태로 정적 프로퍼티에 저장한다.
  throw new Error('TODO: name 을 클래스에 심는 데코레이터를 반환하라');
}

// ─────────────────────────────────────────────────────────────
// 3) getTag : @Tagged 가 심은 태그를 다시 읽는다.
//    태그가 없으면 undefined 를 반환한다.
// ─────────────────────────────────────────────────────────────
export function getTag(target: Function): string | undefined {
  // 힌트: (target as any).__tag__ 를 읽어 반환한다.
  throw new Error('TODO: 클래스에 심긴 __tag__ 를 반환하라');
}
