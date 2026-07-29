// Day 2 — 메서드·프로퍼티 데코레이터 (모범 답안)

export const executionLog: string[] = [];

export function LogExecution(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  const original = descriptor.value;
  descriptor.value = function (this: unknown, ...args: unknown[]) {
    executionLog.push(`${String(propertyKey)} called`);
    return original.apply(this, args);
  };
  return descriptor;
}

export function Memoize(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  const original = descriptor.value;
  descriptor.value = function (this: any, ...args: unknown[]) {
    const cacheProp = `__memo_${String(propertyKey)}__`;
    const cache: Map<string, unknown> = (this[cacheProp] ??= new Map());
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = original.apply(this, args);
    cache.set(key, result);
    return result;
  };
  return descriptor;
}
