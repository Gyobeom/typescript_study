import {
  SortedCollection,
  Money,
  Comparable,
} from '@stage3/day3-comparable';

describe('Day 3 — Money implements Comparable<Money>', () => {
  it('compareTo는 금액 대소에 따라 부호를 반환한다', () => {
    expect(new Money(100).compareTo(new Money(50))).toBeGreaterThan(0);
    expect(new Money(50).compareTo(new Money(100))).toBeLessThan(0);
    expect(new Money(70).compareTo(new Money(70))).toBe(0);
  });
});

describe('Day 3 — SortedCollection<T extends Comparable<T>>', () => {
  it('add한 순서와 무관하게 오름차순을 유지한다', () => {
    const collection = new SortedCollection<Money>();
    collection.add(new Money(30));
    collection.add(new Money(10));
    collection.add(new Money(20));
    expect(collection.toArray().map((m) => m.amount)).toEqual([10, 20, 30]);
  });

  it('min/max를 정확히 반환한다', () => {
    const collection = new SortedCollection<Money>();
    collection.add(new Money(5));
    collection.add(new Money(99));
    collection.add(new Money(42));
    expect(collection.min()?.amount).toBe(5);
    expect(collection.max()?.amount).toBe(99);
  });

  it('비어 있으면 min/max는 undefined, toArray는 빈 배열', () => {
    const collection = new SortedCollection<Money>();
    expect(collection.min()).toBeUndefined();
    expect(collection.max()).toBeUndefined();
    expect(collection.toArray()).toEqual([]);
  });

  it('toArray는 내부 배열이 아닌 사본을 반환한다', () => {
    const collection = new SortedCollection<Money>();
    collection.add(new Money(1));
    const snapshot = collection.toArray();
    snapshot.push(new Money(999));
    expect(collection.toArray()).toHaveLength(1); // 원본 불변
  });

  it('타입 레벨: Comparable을 구현하지 않은 타입은 거부된다', () => {
    // @ts-expect-error number는 compareTo가 없어 Comparable<number>가 아니다
    const bad: SortedCollection<number> = new SortedCollection();
    expect(bad).toBeDefined();
    // Comparable 인터페이스가 export 되는지도 확인
    const asComparable: Comparable<Money> = new Money(1);
    expect(asComparable.compareTo(new Money(1))).toBe(0);
  });
});
