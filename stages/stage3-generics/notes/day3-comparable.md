# Day 3 — 제네릭 + 인터페이스 결합 (`T extends Comparable<T>`)

> 실습 전 30분 이론. 오늘 실습은 `Comparable<T>`를 구현한 타입만 담는 `SortedCollection<T>`다.
> 이 노트는 실습과 다른 예시(우선순위·버전 번호)로 "계약을 제약으로 거는 법"을 익힌다.

---

## 오늘의 학습 목표

1. 제네릭 제약에 **인터페이스**를 거는 것(`T extends SomeInterface`)의 의미를 안다.
2. 인터페이스가 **자기 자신을 참조하는 제네릭**(`Comparable<T>`, self-referential)을 이해한다.
3. 스테이지 2의 인터페이스 지식이 제네릭과 어떻게 결합되는지 연결한다.
4. 비교 계약(`compareTo`의 음수/0/양수 규약)이 표준 정렬과 어떻게 맞물리는지 안다.
5. "계약을 구현한 타입만 받는" 클래스가 왜 안전한지 설명할 수 있다.

---

## 1. 제약에 인터페이스를 걸기

Day 2에선 `T extends { length: number }`처럼 **인라인 모양**으로 제약했다. 그 모양을 이름 붙인 인터페이스로 빼면 의도가 또렷해진다.

```ts
interface HasArea {
  area(): number;
}

class ShapeBin<T extends HasArea> {
  private shapes: T[] = [];
  add(s: T): void { this.shapes.push(s); }
  totalArea(): number {
    return this.shapes.reduce((sum, s) => sum + s.area(), 0);
  }
}
```

`T extends HasArea` 제약 덕분에, `ShapeBin` 내부에서 `s.area()`를 **안심하고** 호출할 수 있다. 컴파일러가 "이 `T`는 반드시 `area()`를 가진다"고 알기 때문이다.

`area()`가 없는 타입을 넣으면:

```ts
class Circle implements HasArea { constructor(public r: number) {} area() { return Math.PI * this.r ** 2; } }
class Empty {}

new ShapeBin<Circle>(); // ✅
new ShapeBin<Empty>();  // ❌ Type 'Empty' does not satisfy the constraint 'HasArea'.
                        //    Property 'area' is missing in type 'Empty'.
```

> 스테이지 2에서 배운 인터페이스가 여기서 **"제네릭의 자격 요건"** 으로 재사용된다.

---

## 2. 자기 참조 제네릭 인터페이스 — `Comparable<T>`

비교는 "자기 자신과 같은 타입끼리"만 의미가 있다. 돈은 돈끼리, 버전은 버전끼리 비교한다. 이걸 타입으로 표현한 게 자기 참조 제네릭이다.

```ts
interface Ordered<T> {
  compareTo(other: T): number;
}
```

여기서 핵심은 `T`가 **자기 자신**을 가리키게 만드는 사용법이다.

```ts
class Version implements Ordered<Version> {
  //                            ^^^^^^^ 자기 자신을 T로
  constructor(public major: number, public minor: number) {}

  compareTo(other: Version): number {
    if (this.major !== other.major) return this.major - other.major;
    return this.minor - other.minor;
  }
}
```

`Ordered<Version>`이라고 씀으로써 "`Version`은 `Version`끼리 비교 가능하다"가 타입으로 못 박힌다. `v.compareTo(anotherVersion)`은 되지만 `v.compareTo("1.2")`는 컴파일 에러다.

---

## 3. `compareTo` 규약 — 음수 / 0 / 양수

`compareTo`는 두 값의 대소를 **부호**로 표현한다. 자바의 `Comparable`, JS `Array.prototype.sort`의 비교자와 같은 관례다.

| 반환값 | 의미 |
|---|---|
| 음수 (< 0) | `this`가 `other`보다 **앞**(작다) |
| 0 | 같다 |
| 양수 (> 0) | `this`가 `other`보다 **뒤**(크다) |

이 규약을 지키면 표준 정렬에 그대로 꽂힌다.

```ts
const versions = [new Version(1, 4), new Version(1, 2), new Version(2, 0)];
versions.sort((a, b) => a.compareTo(b));
// 오름차순: 1.2, 1.4, 2.0
```

`a - b` 형태(숫자 차이)를 반환하면 규약이 저절로 맞는다. `a < b`일 때 음수가 나오기 때문이다. 이게 **정렬 비교자를 `compareTo` 하나로 재사용**하는 트릭이다.

---

## 4. "계약을 구현한 타입만" 담는 컬렉션

이제 조합한다. 비교 가능한 타입만 받아 **항상 정렬 상태를 유지**하는 컬렉션:

```ts
class OrderedBin<T extends Ordered<T>> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
    this.items.sort((a, b) => a.compareTo(b)); // T가 compareTo를 가짐이 제약으로 보장됨
  }

  first(): T | undefined { return this.items[0]; }
  last(): T | undefined { return this.items[this.items.length - 1]; }
}
```

`T extends Ordered<T>` 제약이 없다면 `a.compareTo(b)`에서 컴파일 에러가 난다("`compareTo` does not exist on type `T`"). 제약이 그 호출을 **합법화**한다.

---

## 5. 실무·채용 연결

- **정렬·우선순위 자료구조**: 우선순위 큐, 정렬 트리 등은 "비교 가능한 타입"을 제네릭 제약으로 요구하는 게 정석이다.
- **도메인 값 객체(Value Object)**: 금액(`Money`), 기간, 버전 같은 값 객체에 `compareTo`/`equals`를 붙여 비교 로직을 캡슐화하는 건 DDD 스타일 코드에서 흔하다.
- **인터페이스를 제약으로 쓰는 감각**은 스테이지 2(인터페이스)와 3(제네릭)을 잇는 다리다. 면접에서 "제네릭과 인터페이스를 함께 써본 경험"을 물으면 이 패턴이 답이다.

---

## 6. 흔한 실수와 함정

1. **`compareTo` 규약 방향 뒤집기.** 오름차순인데 `other - this`를 반환하면 내림차순이 된다. "`this`가 작으면 음수"를 항상 기준으로 삼는다.
2. **부동소수/큰 수에서 부호만 필요한데 차이를 반환.** 대부분 문제없지만, 오버플로가 우려되는 극단적 상황에선 `return this.x < other.x ? -1 : this.x > other.x ? 1 : 0`처럼 부호를 직접 반환하는 게 안전하다.
3. **제약을 빼먹고 본문에서 `compareTo` 호출.** "Property 'compareTo' does not exist on type 'T'" 에러의 원인이다. 제약이 곧 접근 권한임을 잊지 말 것.
4. **내부 배열을 그대로 반환.** Day 1과 같은 함정. 정렬된 사본(`[...items]`)을 주고 내부는 감춘다.

---

## 7. 오늘 실습과의 연결 (힌트 수준)

- `SortedCollection<T extends Comparable<T>>`: 4절의 `OrderedBin`과 같은 골격이다. `add` 후 정렬을 유지하는 가장 간단한 방법은 "넣고 나서 `compareTo` 비교자로 정렬"이다.
- 오름차순이 유지되면 **최솟값은 맨 앞, 최댓값은 맨 뒤**다. 인덱스만 보면 된다.
- 실습의 `Money implements Comparable<Money>`는 2절 `Version`과 같은 자기 참조 패턴이다. `amount`의 차이를 반환하면 3절 규약(음수/0/양수)이 자동으로 맞는다.
- `toArray`는 내부 노출 금지 — 6번 함정 4번을 떠올려 사본을 반환한다.

> 답을 여기 적지 않는다. "정렬을 add마다 할지, 조회 때 할지"는 스스로 정할 몫이다(테스트를 통과시키는 가장 단순한 쪽을 택하라).

---

## 8. 셀프 체크

1. `T extends Comparable<T>` 제약이 없으면 `SortedCollection` 본문에서 어떤 에러가 나는가?
2. `Money implements Comparable<Money>`에서 `<Money>`(자기 자신)를 쓰는 이유는?
3. `compareTo`가 음수를 반환하면 `this`와 `other` 중 누가 앞인가?
4. `amount` 차이(`this.amount - other.amount`)를 반환하면 왜 오름차순 정렬에 그대로 쓸 수 있는가?
5. 인터페이스를 제네릭 제약으로 거는 것과, Day 2의 인라인 모양(`{ length: number }`) 제약은 무엇이 같고 무엇이 다른가?
