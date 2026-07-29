// Day 3 — reflect-metadata 와 메타데이터 프로그래밍 (모범 답안)
import 'reflect-metadata';

export function setRole(target: object, role: string): void {
  Reflect.defineMetadata('role', role, target);
}

export function getRole(target: object): string | undefined {
  return Reflect.getMetadata('role', target);
}

export function WithRole(role: string): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata('role', role, target);
  };
}

export function getParamTypes(target: Function): Function[] {
  // emitDecoratorMetadata 가 컴파일러에 심어준 생성자 파라미터 타입 배열.
  // 데코레이터가 없거나 파라미터가 없으면 undefined 이므로 [] 로 보정한다.
  return Reflect.getMetadata('design:paramtypes', target) ?? [];
}
