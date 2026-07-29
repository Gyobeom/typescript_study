// Day 3 — reflect-metadata 와 메타데이터 프로그래밍
//
// reflect-metadata 는 "객체·클래스에 눈에 안 보이는 꼬리표(메타데이터)를 붙이고 읽는" 표준 API 다.
// NestJS DI 의 심장부: @Injectable() 클래스에 대해 TS 컴파일러가 자동으로 심어주는
//   design:paramtypes (= 생성자 파라미터의 타입 목록) 을 Reflect.getMetadata 로 읽어
//   무엇을 주입해야 하는지 알아낸다.
//
// ※ reflect-metadata 는 전역 Reflect 객체를 확장한다. 반드시 파일 최상단에서 import 해야 한다.
import 'reflect-metadata';

// ─────────────────────────────────────────────────────────────
// 1) setRole / getRole : 사용자 정의 메타데이터 쓰기·읽기
//    Reflect.defineMetadata(key, value, target) 로 심고,
//    Reflect.getMetadata(key, target) 로 읽는다.
//    메타데이터 키는 'role' 문자열을 쓴다.
// ─────────────────────────────────────────────────────────────
export function setRole(target: object, role: string): void {
  // 힌트: Reflect.defineMetadata('role', role, target)
  throw new Error('TODO: target 에 role 메타데이터를 심어라');
}

export function getRole(target: object): string | undefined {
  // 힌트: Reflect.getMetadata('role', target)
  throw new Error('TODO: target 의 role 메타데이터를 읽어라');
}

// ─────────────────────────────────────────────────────────────
// 2) @WithRole(role) : 메타데이터를 심는 클래스 데코레이터 팩토리
//    위 setRole 을 활용해도 되고 Reflect API 를 직접 써도 된다.
// ─────────────────────────────────────────────────────────────
export function WithRole(role: string): ClassDecorator {
  // 힌트: (target) => { Reflect.defineMetadata('role', role, target); }
  throw new Error('TODO: role 을 심는 데코레이터를 반환하라');
}

// ─────────────────────────────────────────────────────────────
// 3) getParamTypes : 생성자 파라미터 타입 목록 읽기 (DI 의 핵심!)
//    emitDecoratorMetadata 가 켜져 있고 클래스에 "데코레이터가 하나라도 붙어 있으면",
//    TS 컴파일러가 'design:paramtypes' 메타데이터로 생성자 파라미터 타입 배열을 심어준다.
//    이 배열의 각 원소는 실제 "생성자 함수"(클래스)다.
//
//    Reflect.getMetadata('design:paramtypes', target) 를 반환하되,
//    메타데이터가 없으면 빈 배열 [] 을 반환한다.
// ─────────────────────────────────────────────────────────────
export function getParamTypes(target: Function): Function[] {
  // 힌트: Reflect.getMetadata('design:paramtypes', target) ?? []
  throw new Error('TODO: design:paramtypes 를 읽어 반환하라 (없으면 [])');
}
