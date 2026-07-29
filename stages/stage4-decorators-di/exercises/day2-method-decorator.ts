// Day 2 — 메서드·프로퍼티 데코레이터
//
// 메서드 데코레이터의 시그니처: (target, propertyKey, descriptor) => descriptor | void
//   - target      : 인스턴스 메서드면 클래스의 prototype
//   - propertyKey : 메서드 이름
//   - descriptor  : PropertyDescriptor. descriptor.value 가 원본 함수다.
//
// 핵심 기법: "원본 함수를 보관 → descriptor.value 를 새 함수로 교체 → 새 함수 안에서
//            원본을 apply(this, args) 로 호출"하며 앞뒤에 부가 동작을 끼워 넣는다.
//
// 목표:
//   1) @LogExecution — 메서드 호출을 기록한다 (AOP 로깅의 축소판)
//   2) @Memoize      — 인자 기준으로 결과를 캐싱한다

// 호출 기록을 담는 전역 배열. @LogExecution 이 여기에 push 한다.
export const executionLog: string[] = [];

// ─────────────────────────────────────────────────────────────
// 1) @LogExecution : 메서드 데코레이터
//    메서드가 호출될 때마다 executionLog 에 "<메서드이름> called" 를 남기고,
//    원본 메서드의 반환값을 그대로 돌려준다.
// ─────────────────────────────────────────────────────────────
export function LogExecution(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  // 힌트:
  //   const original = descriptor.value;
  //   descriptor.value = function (...args) {
  //     executionLog.push(`${String(propertyKey)} called`);
  //     return original.apply(this, args);   // this 바인딩·인자 전달 유지
  //   };
  //   return descriptor;
  throw new Error('TODO: 호출을 기록하도록 descriptor.value 를 감싸라');
}

// ─────────────────────────────────────────────────────────────
// 2) @Memoize : 메서드 데코레이터
//    같은 인자로 다시 호출되면 원본을 재실행하지 않고 캐시된 값을 반환한다.
//    캐시 키는 JSON.stringify(args) 로 만든다.
//    (인스턴스별로 캐시가 분리되도록 this 에 캐시 저장소를 둔다.)
// ─────────────────────────────────────────────────────────────
export function Memoize(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  // 힌트:
  //   const original = descriptor.value;
  //   descriptor.value = function (...args) {
  //     const cacheProp = `__memo_${String(propertyKey)}__`;
  //     const cache = (this[cacheProp] ??= new Map());
  //     const key = JSON.stringify(args);
  //     if (cache.has(key)) return cache.get(key);
  //     const result = original.apply(this, args);
  //     cache.set(key, result);
  //     return result;
  //   };
  //   return descriptor;
  throw new Error('TODO: 인자 기준으로 결과를 캐싱하도록 descriptor.value 를 감싸라');
}
