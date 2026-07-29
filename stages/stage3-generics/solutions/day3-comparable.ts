// Day 3 — 제네릭 + 인터페이스 결합 (모범 답안)

/** 자기 자신과 같은 타입끼리 대소를 비교할 수 있는 계약. */
export interface Comparable<T> {
  compareTo(other: T): number;
}

/** Comparable을 구현한 타입만 담아 항상 오름차순을 유지하는 컬렉션. */
export class SortedCollection<T extends Comparable<T>> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
    this.items.sort((a, b) => a.compareTo(b));
  }

  toArray(): T[] {
    return [...this.items];
  }

  min(): T | undefined {
    return this.items[0];
  }

  max(): T | undefined {
    return this.items[this.items.length - 1];
  }
}

/** Comparable을 구현한 예시 값 타입. 금액 크기로 비교한다. */
export class Money implements Comparable<Money> {
  constructor(public readonly amount: number) {}

  compareTo(other: Money): number {
    return this.amount - other.amount;
  }
}
