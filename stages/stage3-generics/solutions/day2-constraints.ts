// Day 2 — 제네릭 제약(T extends ...)과 keyof (모범 답안)

/** length 프로퍼티(number)를 가진 타입만 담을 수 있는 컬렉션. */
export class LengthTracker<T extends { length: number }> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  totalLength(): number {
    return this.items.reduce((sum, item) => sum + item.length, 0);
  }

  longest(): T | undefined {
    if (this.items.length === 0) return undefined;
    return this.items.reduce((max, item) =>
      item.length > max.length ? item : max,
    );
  }
}

/** keyof 를 활용한 타입 안전 프로퍼티 선택기. */
export class PropertyPicker<T extends object> {
  constructor(private readonly source: T) {}

  pluck<K extends keyof T>(key: K): T[K] {
    return this.source[key];
  }

  pick<K extends keyof T>(keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      result[key] = this.source[key];
    }
    return result;
  }
}
