# Day 5 — 종합: 작은 도메인 클래스 설계

> 실습 파일: `exercises/day5-shopping-cart.ts` · 테스트: `tests/day5-shopping-cart.test.ts`
> 이론 30분 → 실습 60~90분

---

## 오늘의 학습 목표

이 노트를 다 읽으면 다음을 할 수 있다.

1. Day1~4에서 배운 개념을 하나의 도메인 안에서 어떤 역할로 조합하는지 설명할 수 있다.
2. 여러 클래스가 **협력**하는 구조(장바구니가 상품 라인들을 담는)를 설계할 수 있다.
3. 내부 배열을 방어적으로 감싸(방어적 복사) 외부 훼손을 막을 수 있다.
4. "합계·소계"처럼 파생 값을 getter로 계산하는 패턴을 쓸 수 있다.
5. 도메인 규칙(중복 상품은 수량 합산 등)을 메서드로 표현할 수 있다.

---

## 개념 설명

오늘은 새 문법이 거의 없다. 대신 **지금까지 배운 것을 조립**한다. 각 개념이 이 도메인에서 어떤 역할을 맡는지 지도를 그려두자.

| Day | 개념 | 오늘의 쓰임 |
|---|---|---|
| Day1 | 클래스/생성자/메서드 | `CartItem`, `ShoppingCart` 자체 |
| Day2 | `private` + 캡슐화, `readonly` | `items` 감추기, `unitPrice` readonly |
| Day3 | 파라미터 프로퍼티, getter | 생성자 축약, `subtotal`/`total` 파생 값 |
| Day4 | static 카운터 | 장바구니 `id` 자동 부여 |

### 1) 두 클래스의 협력

큰 개념을 작은 클래스로 나눈다. `ShoppingCart`(장바구니)는 여러 개의 `CartItem`(상품 라인)을 **담는다**. 이런 "가진다(has-a)" 관계가 도메인 설계의 기본이다.

```ts
// 실습과 다른 도메인(재생목록)으로 예시
class Song {
  constructor(
    public readonly title: string,
    private durationSec: number,
  ) {}
  get seconds(): number {
    return this.durationSec;
  }
}

class Playlist {
  private songs: Song[] = []; // 여러 Song 을 가진다

  add(song: Song): void {
    this.songs.push(song);
  }

  get totalSeconds(): number {
    return this.songs.reduce((sum, s) => sum + s.seconds, 0);
  }
}
```

`Playlist`가 `Song`의 `seconds`를 불러 합계를 낸다. 각자 자기 책임만 진다 — `Song`은 자기 길이를, `Playlist`는 전체 합을. 이렇게 책임을 나누는 게 좋은 설계다.

### 2) 파생 값은 getter로 계산

소계·합계는 저장하지 않는다. 매번 계산한다. 그래야 수량이 바뀌어도 자동으로 맞다.

```ts
class Line {
  constructor(
    public readonly price: number,
    private count: number,
  ) {}
  get subtotal(): number {
    return this.price * this.count; // 저장 아님, 계산
  }
}
```

여러 라인의 합계는 `reduce`로 모은다.

```ts
get total(): number {
  return this.lines.reduce((sum, line) => sum + line.subtotal, 0);
}
```

`reduce`는 배열을 하나의 값으로 접는다. 두 번째 인자 `0`은 시작값(합계 초기값)이다.

### 3) 방어적 복사 — 내부 배열 보호

`private items`로 감춰도, 배열 **자체**를 밖으로 그대로 돌려주면 구멍이 생긴다. 받은 쪽이 그 배열을 바꾸면 내부까지 바뀌기 때문이다.

```ts
class Bag {
  private items: string[] = ['a', 'b'];

  // 위험: 내부 배열을 그대로 노출
  getItemsBad(): string[] {
    return this.items;
  }

  // 안전: 얕은 복사본을 준다 (방어적 복사)
  getItemsSafe(): string[] {
    return [...this.items];
  }
}

const bag = new Bag();
bag.getItemsBad().pop(); // 내부 배열이 훼손됨! ['a'] 로 줄어듦
bag.getItemsSafe().pop(); // 복사본만 훼손, 내부는 그대로
```

`[...this.items]`는 원소를 새 배열로 펼쳐 담는 **얕은 복사**다. 받은 쪽이 이 복사본을 아무리 주물러도 원본 `items`는 안전하다. 오늘 테스트가 정확히 이 동작(`items.pop()` 후에도 내부 유지)을 확인한다.

### 4) 도메인 규칙을 메서드로

"같은 상품을 다시 담으면 새 라인을 추가하지 말고 수량을 합친다"는 장바구니의 도메인 규칙이다. 이런 규칙은 조건문으로 메서드 안에 표현한다.

```ts
// 의사코드 흐름 (구현은 직접)
addItem(item):
  같은 name 의 기존 라인을 찾는다
  있으면  → 기존 라인의 수량을 item 의 수량만큼 늘린다
  없으면  → items 에 새로 push
```

`Array.prototype.find`로 같은 이름을 찾고, 있으면 Day5의 `changeQuantity`를 재사용한다. 이미 만든 메서드를 다시 쓰는 것도 좋은 설계다.

---

## 실무 · 채용 연결

- 오늘 만드는 구조가 바로 **도메인 모델**이다. 실무의 Entity/도메인 객체는 이렇게 "상태 + 그 상태를 지키는 규칙"을 한 클래스에 담는다. 규칙을 Service에 흩뿌리지 않고 도메인 객체 안에 두는 설계를 "리치 도메인 모델"이라 부른다.
- 방어적 복사는 **실무 버그의 단골 원인**을 막는다. "내가 안 바꿨는데 값이 왜 바뀌었지?"의 상당수가 내부 배열/객체를 그대로 노출해서 생긴다. 코드 리뷰에서 자주 지적되는 지점이다.
- 파생 값을 getter로 계산하는 습관은 "데이터 정합성"을 지킨다. 합계를 필드로 따로 저장하면, 수량을 바꿀 때마다 합계도 갱신해야 하고 하나라도 빠지면 어긋난다.

---

## 흔한 실수와 함정

1. **`getItems`에서 내부 배열을 그대로 반환.** `return this.items`는 방어적 복사 테스트를 깬다. `return [...this.items]`.
2. **중복 상품을 새 라인으로 추가.** `addItem`에서 기존 라인을 찾지 않고 무조건 `push`하면, 같은 상품이 두 줄이 되어 `itemCount` 테스트가 깨진다.
3. **소계/합계를 필드로 저장했다가 갱신을 놓친다.** 저장하지 말고 getter로 매번 계산하라.
4. **static 카운터 초기화를 빼먹는다.** Day4와 동일. `resetCartCount`를 `beforeEach`가 부른다. 리셋이 없으면 id가 1부터 시작하지 않는다.
5. **`reduce`의 초기값 `0`을 빼먹는다.** 빈 배열에서 초기값 없이 `reduce`하면 런타임 에러(`Reduce of empty array with no initial value`)가 난다.

---

## 오늘 실습과의 연결

`exercises/day5-shopping-cart.ts`의 `CartItem`과 `ShoppingCart`를 구현한다.

- **`CartItem` 생성자**: 파라미터 프로퍼티 축약(Day3). `unitPrice < 0` 또는 `quantity < 1`이면 throw(Day2 검증).
- **`CartItem.qty` / `subtotal`**: getter(Day3). `subtotal = unitPrice * quantity`.
- **`CartItem.changeQuantity`**: 결과가 1 미만이면 throw. 거부 시 값 유지.
- **`ShoppingCart` 생성자 + static**: `cartCount` 카운터로 `id` 자동 부여(Day4).
- **`addItem`**: 위 4) 중복 규칙. 같은 `name`이면 수량 합산, 없으면 추가.
- **`itemCount` / `total`**: getter. `total`은 `reduce`로 각 `subtotal` 합.
- **`getItems`**: 위 3) 방어적 복사. `[...this.items]`.
- **`items`는 `private`**: 외부 직접 접근이 막혀야 `@ts-expect-error` 통과.

막히면 Day1~4 노트로 돌아가 해당 개념을 다시 확인하라. 오늘은 새 문법이 아니라 조합이 관건이다.

---

## 셀프 체크

1. `ShoppingCart`가 `CartItem`을 "가진다(has-a)"는 관계는 코드에서 어떻게 표현되는가?
2. 소계·합계를 필드로 저장하는 것과 getter로 매번 계산하는 것의 차이는? 어느 쪽이 데이터 정합성에 유리한가?
3. `getItems`가 `return this.items` 대신 `return [...this.items]`를 해야 하는 이유는? 전자면 어떤 테스트가 깨지는가?
4. `addItem`에서 같은 상품을 다시 담을 때, 새 라인을 추가하는 대신 무엇을 해야 하는가? 어떤 기존 메서드를 재사용하는가?
5. `total`을 `reduce`로 구현할 때 초기값을 빼먹으면 무슨 일이 생기는가?
