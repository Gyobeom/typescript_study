// Day 2 — 제네릭 제약(T extends ...)과 keyof
//
// 제네릭 T는 기본적으로 "무엇이든" 될 수 있어서, T의 프로퍼티에 함부로 접근할 수 없다.
// `T extends 어떤타입` 제약을 걸면 "이런 모양을 반드시 가진 타입만 받는다"고 좁힐 수 있다.
//
//   function len<T extends { length: number }>(x: T): number { return x.length; }
//
// keyof T 는 "T가 가진 프로퍼티 키들의 유니온 타입"이다.
//   type P = keyof { a: 1; b: 2 };  // 'a' | 'b'
// 이걸 K extends keyof T 제약과 함께 쓰면 "그 객체에 실제로 존재하는 키만" 받게 만들 수 있고,
// 반환 타입을 T[K]로 두면 값의 타입까지 정확히 추론된다.

/** length 프로퍼티(number)를 가진 타입만 담을 수 있는 컬렉션. */
export class LengthTracker<T extends { length: number }> {
  private items: T[] = [];

  /** 원소를 추가한다. */
  add(item: T): void {
    // 힌트: 그냥 배열에 넣으면 된다. 타입 제약은 이미 시그니처가 보장한다.
    this.items.push(item);
  }

  /** 담긴 모든 원소의 length 합계. */
  totalLength(): number {
    // 힌트: 각 원소의 .length 를 더한다. reduce가 편하다.
    return this.items.reduce((sum, item) => { return sum + item.length }, 0)
  }

  /** length가 가장 큰 원소. 비어 있으면 undefined. */
  longest(): T | undefined {
    if (this.items.length === 0)
      return undefined
    // 힌트: 최댓값 비교. 비어 있으면 undefined를 반환한다.
    return this.items.reduce((acc, cur) => {
      return cur.length > acc.length ? cur : acc;
    });
  }
}

/**
 * keyof 를 활용한 타입 안전 프로퍼티 선택기.
 * 존재하지 않는 키로 pluck을 호출하면 컴파일 에러가 나야 한다.
 */
export class PropertyPicker<T extends object> {
  constructor(private readonly source: T) { }

  /**
   * source에서 key에 해당하는 값을 꺼낸다.
   * K는 T의 실제 키로 제약되고, 반환 타입은 T[K]다.
   */
  pluck<K extends keyof T>(key: K): T[K] {
    return this.source[key];
  }

  /** 여러 키를 골라 부분 객체를 만든다. 반환 타입은 Pick<T, K>. */
  pick<K extends keyof T>(keys: K[]): Pick<T, K> {
    // 힌트: 빈 객체에서 시작해 keys를 돌며 source[key]를 복사한다.
    //       결과를 Pick<T, K>로 단언(as)해도 좋다.
    const out = {} as Pick<T, K>;
    for (const k of keys) {
      out[k] = this.source[k];
    }
    return out;
  }
}
