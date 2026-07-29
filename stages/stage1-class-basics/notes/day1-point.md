# Day 1 — 클래스 선언 · 생성자 · 프로퍼티 · 메서드

> 실습 파일: `exercises/day1-point.ts` · 테스트: `tests/day1-point.test.ts`
> 이론 30분 → 실습 60~90분

---

## 오늘의 학습 목표

이 노트를 다 읽으면 다음을 할 수 있다.

1. `class` 키워드로 클래스를 선언하고, 필드(프로퍼티)에 타입을 붙일 수 있다.
2. `constructor`가 언제·어떻게 호출되는지 설명하고, `this`로 인스턴스 상태를 초기화할 수 있다.
3. 메서드를 정의하고 반환 타입을 명시할 수 있다.
4. "새 객체를 만들어 반환하는" **불변(immutable)** 스타일 메서드와, 기존 객체를 바꾸는 스타일의 차이를 안다.
5. strict 모드에서 나는 "필드 초기화 안 됨" 에러의 원인을 이해한다.

---

## 개념 설명

### 1) 클래스는 "객체를 찍어내는 틀"이다

지금까지 배운 `interface`나 `type`은 **모양(타입)만** 정의했다. 클래스는 여기에 더해 **동작(메서드)과 실제 값을 만드는 방법(생성자)**까지 하나로 묶는다.

비유하자면 인터페이스는 "붕어빵의 설계도", 클래스는 "붕어빵 틀"이다. 틀(`class`)이 있으면 `new`로 붕어빵(인스턴스)을 몇 개든 찍어낼 수 있다.

```ts
// 실습과 다른 도메인(원)으로 예시를 든다
class Circle {
  radius: number; // ① 프로퍼티(필드) 선언 — 타입 명시

  constructor(radius: number) {
    // ② 생성자: new 할 때 딱 한 번 실행됨
    this.radius = radius; // this = 지금 만들어지는 그 인스턴스
  }

  area(): number {
    // ③ 메서드: 이 인스턴스의 동작
    return Math.PI * this.radius ** 2;
  }
}

const c = new Circle(2); // new 가 인스턴스를 만들고 constructor 를 호출
console.log(c.radius); // 2
console.log(c.area()); // 12.566...
```

정리하면 클래스는 세 조각으로 이루어진다.

| 조각 | 역할 | 예시 |
|---|---|---|
| 프로퍼티(필드) | 인스턴스가 가지는 상태 | `radius: number` |
| 생성자 | `new` 시점의 초기화 | `constructor(radius) { ... }` |
| 메서드 | 인스턴스의 동작 | `area(): number { ... }` |

### 2) `this`가 가리키는 것

메서드나 생성자 안의 `this`는 **지금 다루고 있는 그 인스턴스**를 가리킨다. `c.area()`를 호출하면 그 안의 `this`는 `c`다. `d.area()`를 호출하면 `this`는 `d`다. 즉 같은 코드라도 어떤 인스턴스로 호출했느냐에 따라 `this`가 달라진다.

```ts
const a = new Circle(1);
const b = new Circle(10);
a.area(); // 이 호출의 this = a → 3.14...
b.area(); // 이 호출의 this = b → 314.15...
```

### 3) 반환 타입 명시와 메서드

메서드 이름 뒤 `(): 반환타입` 으로 무엇을 돌려줄지 적는다. 계산만 하고 아무것도 안 돌려주면 `void`다.

```ts
class Counter {
  count: number = 0;

  increment(): void {
    // 반환값 없음 → void
    this.count += 1;
  }

  read(): number {
    // number 를 돌려줌
    return this.count;
  }
}
```

### 4) 불변(immutable) 스타일 — 새 객체를 반환하기

객체를 바꾸는 방법은 두 가지다.

- **가변(mutable)**: 자기 자신의 필드를 직접 바꾼다. `this.x += dx`
- **불변(immutable)**: 자신은 그대로 두고, 바뀐 값을 담은 **새 인스턴스**를 만들어 돌려준다.

```ts
class Money {
  constructor(public won: number) {}

  // 불변: 원본은 그대로, 새 Money 를 반환
  plus(amount: number): Money {
    return new Money(this.won + amount);
  }
}

const wallet = new Money(1000);
const richer = wallet.plus(500);
console.log(wallet.won); // 1000 (원본 불변!)
console.log(richer.won); // 1500 (새 객체)
console.log(richer === wallet); // false — 서로 다른 객체
```

`richer === wallet`이 `false`인 이유가 핵심이다. `new`로 만든 것은 항상 **다른 참조**다. 오늘 실습의 `translate`가 바로 이 불변 스타일을 요구한다.

### 5) 컴파일 에러 미리 보기

`tsconfig`의 strict 모드가 켜져 있으면, 필드를 선언만 하고 생성자에서 초기화하지 않으면 이런 에러가 난다.

```ts
class Broken {
  x: number; // 선언은 했는데
  constructor() {
    // 여기서 this.x 를 할당하지 않음
  }
}
```

```
error TS2564: Property 'x' has no initializer and is not
definitely assigned in the constructor.
```

번역하면 "`x`는 초기화되지 않았고 생성자에서 확실히 할당되지도 않았다"이다. 해결은 간단하다. 생성자 안에서 `this.x = ...` 로 반드시 값을 넣어주면 된다.

---

## 실무 · 채용 연결

- 클래스는 NestJS에서 **모든 것의 단위**다. Controller, Service, Entity, DTO가 전부 클래스다.
- 오늘 배운 "새 객체를 반환하는 불변 메서드"는 실무에서 **버그를 줄이는 핵심 습관**이다. 함수가 넘겨받은 객체를 몰래 바꾸면(부수효과) 추적하기 어려운 버그가 생긴다. 그래서 실무 코드 리뷰에서 "이 메서드 원본을 변경하나요?"는 단골 질문이다.
- `distanceTo(other: Point)` 처럼 **자기와 같은 타입을 파라미터로 받는** 메서드는, 도메인 객체끼리 협력하는 설계의 기본형이다.

---

## 흔한 실수와 함정

1. **`this`를 빼먹는다.** 생성자에서 `x = x`라고 쓰면 파라미터에 파라미터를 대입하는 무의미한 코드가 된다. 반드시 `this.x = x`.
2. **`new`를 빼먹는다.** `const p = Point(3, 4)` 는 에러다(`'new' expression, whose target lacks a construct signature...` 또는 호출 불가 에러). 클래스는 반드시 `new`로 만든다.
3. **초기화 누락 에러(TS2564).** 위에서 본 그 에러. 필드를 선언했으면 생성자에서 값을 채워라.
4. **불변 메서드에서 자기 자신을 바꿔버린다.** `translate` 안에서 `this.x += dx`를 하고 `this`를 반환하면, 원본이 바뀌어 "원본 불변" 테스트가 깨진다. 반드시 `return new Point(...)`.

---

## 오늘 실습과의 연결

`exercises/day1-point.ts`의 `Point` 클래스를 구현한다. 각 TODO가 오늘 개념 어디에 대응하는지만 짚는다(구현은 직접).

- **생성자**: 위 "3) `this` 초기화" 그대로. `x`, `y`를 `this`에 담는다.
- **`distanceFromOrigin` / `distanceTo`**: 메서드 + 반환 타입 명시. `Math.sqrt`와 `**` 연산자. `distanceTo`는 파라미터로 받은 다른 `Point`의 좌표를 쓴다.
- **`translate`**: 위 "4) 불변 스타일"이 핵심. 원본을 건드리지 말고 `new Point(...)`를 반환하라. 테스트가 `moved !== p`를 확인한다.
- **`toString`**: 템플릿 리터럴 `` `(${...}, ${...})` ``. 테스트 기대값은 정확히 `"(1, 2)"`이니 쉼표 뒤 공백까지 맞춘다.

---

## 셀프 체크

1. `interface`와 `class`의 차이를 한 문장으로 말해보라. (힌트: 클래스가 추가로 가지는 것은?)
2. `const p = new Point(3, 4)` 에서 `constructor`는 몇 번 호출되는가? `this`는 무엇을 가리키는가?
3. `translate`가 `this`를 바꾸지 않고 새 객체를 반환해야 하는 이유는? 만약 `this`를 바꾸면 어떤 테스트가 깨지는가?
4. 필드를 `x: number`로 선언만 하고 생성자에서 할당하지 않으면 어떤 컴파일 에러가 나는가?
5. 메서드가 아무 값도 돌려주지 않을 때 반환 타입은 무엇으로 적는가?
