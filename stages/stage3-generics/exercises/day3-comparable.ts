// Day 3 — 제네릭 + 인터페이스 결합
//
// 제네릭 제약에 인터페이스를 걸면 "이 계약을 구현한 타입만" 받는 클래스를 만들 수 있다.
// 자바의 Comparable<T> 와 같은 발상이다.
//
//   interface Comparable<T> { compareTo(other: T): number; }
//
// compareTo는 관례상:
//   음수  → this가 other보다 앞(작다)
//   0     → 같다
//   양수  → this가 other보다 뒤(크다)
//
// SortedCollection<T> 는 "T가 Comparable<T>를 구현했다"는 것을 제약으로 요구한다.
// 그래야 내부에서 안심하고 item.compareTo(...)를 호출할 수 있다.

/** 자기 자신과 같은 타입끼리 대소를 비교할 수 있는 계약. */
export interface Comparable<T> {
  /** 음수: this<other, 0: 같음, 양수: this>other */
  compareTo(other: T): number;
}

/**
 * Comparable을 구현한 타입만 담아 항상 오름차순 정렬 상태를 유지하는 컬렉션.
 * T extends Comparable<T> 제약이 핵심이다.
 */
export class SortedCollection<T extends Comparable<T>> {
  private items: T[] = [];

  /**
   * 값을 추가하되, 추가 후에도 오름차순이 유지되도록 한다.
   * (간단하게: 넣고 정렬해도 되고, 올바른 위치에 삽입해도 된다.)
   */
  add(item: T): void {
    this.items.push(item);
    this.items.sort((a, b) => a.compareTo(b))
    // 힌트: this.items.push 후 this.items.sort((a, b) => a.compareTo(b)) 면 충분하다.
  }

  /** 정렬된 순서 그대로의 배열 사본을 반환한다(내부 배열 노출 금지). */
  toArray(): T[] {
    return [...this.items]
    // 힌트: 스프레드([...])로 사본을 만들어 반환한다.
  }

  /** 가장 작은 값. 비어 있으면 undefined. */
  min(): T | undefined {
    // 힌트: 오름차순이므로 맨 앞이 최솟값이다.
    return this.items[0]
  }

  /** 가장 큰 값. 비어 있으면 undefined. */
  max(): T | undefined {
    // 힌트: 오름차순이므로 맨 뒤가 최댓값이다.
    return this.items[this.items.length - 1]
  }
}

/**
 * 테스트에서 쓸, Comparable을 구현한 예시 값 타입.
 * 돈(금액)을 감싸 금액 크기로 비교한다.
 */
export class Money implements Comparable<Money> {
  constructor(public readonly amount: number) { }

  compareTo(other: Money): number {
    // 힌트: amount 차이를 반환하면 정렬 비교자로 그대로 쓸 수 있다.
    if (this.amount !== other.amount) return this.amount - other.amount;
    return this.amount - other.amount;
  }
}
