# Day 1 — 제네릭 클래스 기초: 타입을 매개변수로 받기

> 실습 전에 30분간 읽는 이론 노트. 오늘 실습은 `Stack<T>` / `Queue<T>`를 직접 구현한다.
> 이 노트는 실습과 **다른 예시(상자·리스트)** 로 개념을 먼저 몸에 익히게 한다.

---

## 오늘의 학습 목표

1. 제네릭이 "**타입을 매개변수로 받는다**"는 말의 의미를 값 매개변수와 대비해 설명할 수 있다.
2. `class Box<T>`에서 `T`가 프로퍼티·인자·반환 타입에 어떻게 흘러가는지 추적할 수 있다.
3. `any`로 도망친 코드와 제네릭 코드의 차이를, **컴파일 에러가 나느냐**로 구분할 수 있다.
4. 타입 **추론**(`new Box(1)`)과 **명시**(`new Box<number>()`)의 차이를 안다.
5. 제네릭 클래스가 왜 "코드는 한 번, 타입은 인스턴스마다"인지 설명할 수 있다.

---

## 1. 제네릭이란 — "값 매개변수"의 타입 버전

함수는 이미 **값**을 매개변수로 받는다.

```ts
function double(x: number): number {
  return x * 2;
}
double(3); // 3을 x 자리에 "채워 넣는다"
```

`x`는 호출할 때 정해진다. 함수를 정의하는 시점엔 "아직 모르는 값"이다.

제네릭은 여기서 한 층을 더 올린다. **타입 자체를 나중에 채워 넣는다.**

```ts
class Box<T> {
  private value!: T;
  put(v: T): void { this.value = v; }
  take(): T { return this.value; }
}
```

`<T>`는 "이 클래스는 아직 모르는 타입 하나를 쓸 건데, 그걸 `T`라고 부르겠다"는 선언이다.
`T`는 특별한 예약어가 아니라 **이름**일 뿐이다. `Box<Item>`, `Box<Payload>`처럼 뜻이 드러나는 이름을 써도 된다(관례상 한 글자 `T`, `U`, `K`, `V`를 자주 쓴다).

사용하는 쪽에서 타입을 확정한다.

```ts
const b = new Box<string>(); // 이 순간 T = string 으로 확정
b.put('hello');
const s = b.take(); // s: string
b.put(42);          // ❌ Argument of type 'number' is not assignable to parameter of type 'string'.
```

`new Box<string>()`를 부른 순간, **이 인스턴스는 문자열 전용 상자**가 된다. `put`도 `take`도 전부 `string`으로 굳는다.

---

## 2. `any`와 무엇이 다른가 — 핵심 대비

가장 흔한 오해: "그냥 `any` 쓰면 되지 않나?" 아니다. `any`는 타입 검사를 **끄는** 것이고, 제네릭은 타입을 **이어주는** 것이다.

```ts
class AnyBox {
  private value: any;
  put(v: any) { this.value = v; }
  take(): any { return this.value; }
}

const ab = new AnyBox();
ab.put('hello');
const n: number = ab.take(); // ✅ 컴파일은 통과한다... 하지만 런타임엔 string!
console.log(n.toFixed(2));   // 💥 TypeError: n.toFixed is not a function
```

`any`는 **넣을 때도 꺼낼 때도 무검사**라, 문자열을 넣고 숫자로 꺼내도 컴파일러가 침묵한다. 버그가 런타임까지 살아남는다.

제네릭은 "넣은 타입 = 꺼내는 타입"을 **컴파일 단계에서** 강제한다.

```ts
const gb = new Box<string>();
gb.put('hello');
const n2: number = gb.take(); // ❌ Type 'string' is not assignable to type 'number'.
```

| 구분 | `any` | 제네릭 `<T>` |
|---|---|---|
| 타입 검사 | 꺼짐 | 켜진 채 유지 |
| 넣은 타입 ↔ 꺼낸 타입 연결 | 끊김 | 이어짐 |
| 잘못 쓰면 | 런타임 폭발 | **컴파일 에러** |
| 자동완성 | 없음(`any`엔 멤버 없음) | 정확히 뜸 |

> 기억할 문장: **`any`는 안전을 포기하는 것, 제네릭은 안전을 유지하며 재사용하는 것.**

---

## 3. 타입 추론 vs 명시

`T`를 항상 손으로 적을 필요는 없다. 인자를 보고 컴파일러가 알아낸다.

```ts
function wrap<T>(value: T): T[] {
  return [value];
}

const a = wrap('hi');   // T 추론 → string,  a: string[]
const b = wrap(123);    // T 추론 → number,  b: number[]
const c = wrap<boolean>(true); // 명시도 가능
```

클래스도 생성자 인자가 있으면 추론된다.

```ts
class Cell<T> {
  constructor(public value: T) {}
}
const cell = new Cell('text'); // T 추론 → string
```

**언제 명시하나?**
- 생성자에 인자가 없어 추론할 근거가 없을 때 → `new Stack<number>()`처럼 명시 필요.
- 추론 결과가 너무 넓거나 너무 좁아 원하는 타입과 다를 때.

오늘 실습의 `new Stack<number>()`가 명시가 필요한 대표 사례다(빈 컨테이너로 시작하니 추론할 값이 없다).

---

## 4. 제네릭 클래스는 "타입별로 복붙"을 없앤다

제네릭이 없다면 타입마다 클래스를 따로 써야 한다.

```ts
class NumberList { private items: number[] = []; add(x: number) { this.items.push(x); } }
class StringList { private items: string[] = []; add(x: string) { this.items.push(x); } }
// ... UserList, OrderList ... 무한 복제
```

제네릭이면 **한 번**이면 끝이다.

```ts
class TypedList<T> {
  private items: T[] = [];
  add(x: T): void { this.items.push(x); }
  at(i: number): T | undefined { return this.items[i]; }
}

const nums = new TypedList<number>();
const names = new TypedList<string>();
```

로직(코드)은 하나인데, 타입은 인스턴스마다 다르게 굳는다. 이것이 제네릭의 핵심 이득이다.

---

## 5. 실무·채용 연결

- **표준 라이브러리가 이미 제네릭이다.** `Array<T>`, `Map<K, V>`, `Set<T>`, `Promise<T>`가 전부 제네릭 클래스/인터페이스다. `Promise<User>`를 읽을 수 있다는 건 이미 제네릭을 읽고 있다는 뜻이다.
- **면접에서 "any를 왜 피하나?"** 는 단골 질문이다. 오늘 배운 "any는 검사를 끄고 제네릭은 연결한다"가 정확한 답이다.
- 오늘의 `Stack`/`Queue`는 사소해 보이지만, 앞으로 배울 `Repository<T>`(Day 4)의 뼈대다. **내부 배열/맵을 감싸 타입 안전한 API를 노출**하는 패턴은 동일하다.

---

## 6. 흔한 실수와 함정

1. **`any`로 도망가기.** `T`를 붙이기 귀찮다고 `items: any[]`로 두면 그 순간 오늘의 이점이 전부 사라진다. 컨테이너의 존재 이유가 없어진다.
2. **꺼낼 때 `undefined` 가능성 무시.** 빈 컨테이너에서 `pop()`/`peek()`은 값이 없다. 반환 타입이 `T | undefined`인 이유다. `T`로만 두면 빈 경우를 표현할 수 없다.
3. **내부 배열을 그대로 노출.** `getItems(): T[] { return this.items; }`는 캡슐화를 깬다. 호출자가 내부 배열을 직접 조작할 수 있다. 사본(`[...this.items]`)을 주거나 필요한 메서드만 노출한다.
4. **`T`를 남발.** 타입 변수가 실제로 여러 타입에 쓰이지 않는데 `<T>`를 붙이는 건 소음이다. "이 자리에 여러 타입이 들어올 수 있는가?"가 판단 기준이다.

---

## 7. 오늘 실습과의 연결 (힌트 수준)

- `Stack<T>`(LIFO)와 `Queue<T>`(FIFO)는 둘 다 **내부 배열 `T[]`를 감싸는** 구조다. 오늘 배운 `TypedList<T>`가 그 원형이다.
- 스택의 "맨 위"와 큐의 "앞/뒤"를 배열의 **어느 끝**에 대응시킬지만 정하면 대부분 풀린다. 배열이 이미 제공하는 메서드로 충분하다.
- 비어 있을 때의 반환 타입이 왜 `T | undefined`인지, 3번 함정을 떠올리며 접근하라.
- `size`는 `get size()` 접근자다. 내부 배열의 길이를 그대로 비추면 된다.

> 답을 여기서 주지 않는다. "어느 끝을 위/앞으로 볼까"를 스스로 정하는 게 오늘의 핵심 결정이다.

---

## 8. 셀프 체크

1. `class Box<T>`에서 `T`는 **언제** 실제 타입으로 확정되는가?
2. `any`를 쓴 상자에 `string`을 넣고 `number`로 꺼내면 에러는 컴파일 때 나는가, 런타임 때 나는가? 제네릭이면?
3. `new Stack<number>()`처럼 타입을 **명시해야만** 하는 경우는 어떤 상황인가?
4. 빈 컨테이너의 `pop()` 반환 타입이 `T`가 아니라 `T | undefined`여야 하는 이유는?
5. `Promise<User>`, `Map<string, User>`는 각각 몇 개의 타입 매개변수를 받는가?
