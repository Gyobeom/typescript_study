# Day 3 — 파라미터 프로퍼티 축약 · getter/setter

> 실습 파일: `exercises/day3-temperature.ts` · 테스트: `tests/day3-temperature.test.ts`
> 이론 30분 → 실습 60~90분

---

## 오늘의 학습 목표

이 노트를 다 읽으면 다음을 할 수 있다.

1. `constructor(private x: number)` 파라미터 프로퍼티 축약이 무엇을 자동으로 해주는지 설명할 수 있다.
2. 축약형과 풀어 쓴 형이 완전히 같은 코드임을 대응시켜 볼 수 있다.
3. `get` / `set` 접근자로 메서드를 프로퍼티처럼 쓰는 법을 안다.
4. "내부 표현"과 "외부 인터페이스"를 분리하는 설계(섭씨 저장 ↔ 화씨 노출)를 이해한다.
5. setter 안에서 검증을 걸어 잘못된 값을 막을 수 있다.

---

## 개념 설명

### 1) 파라미터 프로퍼티 축약

Day 1~2에서 필드를 이렇게 세 번에 걸쳐 썼다.

```ts
class Product {
  private price: number; // ① 필드 선언
  constructor(price: number) {
    // ② 파라미터 받고
    this.price = price; // ③ this 에 할당
  }
}
```

TypeScript는 이 반복을 줄여준다. **생성자 파라미터 앞에 접근제어자(`public`/`private`/`protected`/`readonly`)를 붙이면**, 위 ①②③이 자동으로 이루어진다.

```ts
class Product {
  constructor(private price: number) {} // 위 세 줄과 완전히 동일
}
```

이 둘은 컴파일 결과가 같다. 즉 `private price`라는 필드가 생기고, 생성 시 자동으로 `this.price = price`가 실행된다.

```ts
const p = new Product(1000);
p.getPriceSomehow(); // 내부에서 this.price 로 접근 가능
// p.price;          // ❌ private 이라 외부 접근 불가 (축약이어도 private 은 그대로)
```

여러 개도 나열할 수 있다.

```ts
class Rectangle {
  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  area(): number {
    return this.width * this.height; // 이미 필드로 존재
  }
}
```

**중요**: 축약을 써도 생성자 본문에 코드를 넣을 수 있다. 할당은 자동으로 끝난 상태이므로, 본문에서는 검증 같은 추가 로직만 넣으면 된다.

```ts
class Product2 {
  constructor(private price: number) {
    // 이 시점에 this.price 는 이미 할당돼 있음
    if (this.price < 0) throw new Error('가격은 음수일 수 없습니다');
  }
}
```

### 2) getter / setter 접근자

`get`/`set`은 **메서드인데 프로퍼티처럼 쓰게** 해준다. 괄호 없이 `t.f`로 읽고 `t.f = 100`으로 쓴다.

```ts
class Box {
  constructor(private widthCm: number) {}

  get widthMm(): number {
    // 읽을 때: t.widthMm
    return this.widthCm * 10;
  }

  set widthMm(mm: number) {
    // 쓸 때: t.widthMm = 50
    this.widthCm = mm / 10;
  }
}

const box = new Box(3); // 내부는 cm 로 저장
console.log(box.widthMm); // 30  (get 호출) — 괄호 없음!
box.widthMm = 50; // (set 호출) → 내부 widthCm = 5
```

일반 메서드였다면 `box.getWidthMm()`, `box.setWidthMm(50)`으로 썼을 것이다. getter/setter는 이걸 필드 접근처럼 보이게 만든다.

### 3) 내부 표현 ↔ 외부 인터페이스 분리

오늘의 핵심 설계다. **값은 한 가지 단위로만 저장**하고, 다른 단위는 getter/setter로 **그때그때 변환**한다.

- 내부 저장: 섭씨(`celsius`) 하나만
- 외부 노출: 섭씨(`c`)와 화씨(`f`) 둘 다 — 하지만 화씨는 저장하지 않고 변환

```ts
class Angle {
  constructor(private radians: number) {} // 내부는 라디안만 저장

  get deg(): number {
    return (this.radians * 180) / Math.PI; // 읽을 때 변환
  }
  set deg(d: number) {
    this.radians = (d * Math.PI) / 180; // 쓸 때 역변환해 저장
  }
}
```

이렇게 하면 "섭씨와 화씨가 서로 안 맞는" 모순 상태가 생길 수 없다. 진실의 원천(source of truth)이 하나뿐이기 때문이다.

### 4) setter 검증과 컴파일 에러

setter에 검증을 넣으면 "프로퍼티에 대입하는데도" 규칙이 강제된다.

```ts
class Volume {
  constructor(private liters: number) {}
  set value(v: number) {
    if (v < 0) throw new Error('부피는 음수일 수 없습니다');
    this.liters = v;
  }
}

const vol = new Volume(1);
vol.value = -5; // 런타임에 throw! 대입처럼 보여도 setter 가 실행됨
```

`private` 필드에 외부에서 접근하면 Day 2와 같은 에러가 난다.

```
error TS2341: Property 'celsius' is private and only
accessible within class 'Temperature'.
```

오늘 테스트도 `t.celsius` 직접 접근이 막혀야(`@ts-expect-error`) 통과한다.

---

## 실무 · 채용 연결

- **파라미터 프로퍼티는 NestJS 의존성 주입(DI)의 표준 표기다.** 실무 코드가 온통 이 문법이다.

  ```ts
  @Injectable()
  export class OrderService {
    constructor(
      private readonly orderRepo: OrderRepository,
      private readonly paymentClient: PaymentClient,
    ) {}
  }
  ```

  이 한 블록에 Day2(`private readonly`)와 Day3(파라미터 프로퍼티)이 다 들어 있다. NestJS가 생성자 파라미터의 타입을 보고 알맞은 객체를 자동으로 넣어준다. 이 문법이 눈에 익지 않으면 프레임워크 코드가 마법처럼 보인다.
- getter는 **계산된 속성**(파생 값)을 표현할 때 쓴다. 엔티티에서 `get fullName()`, `get isExpired()` 같은 식이다. 저장하지 않고 매번 계산하므로 데이터 불일치가 없다.

---

## 흔한 실수와 함정

1. **축약과 수동 선언을 동시에 한다.** `constructor(private celsius: number)`라고 써놓고 클래스 본문에 또 `private celsius: number`를 선언하면 중복 에러가 난다. 하나만.
2. **getter를 괄호로 호출한다.** `t.f`가 맞다. `t.f()`는 "number는 호출 불가"(`This expression is not callable`) 에러.
3. **setter에서 검증을 빼먹는다.** getter만 신경 쓰고 setter 검증을 놓치면 잘못된 값이 그대로 저장된다. 화씨 setter도 변환 **후** 절대영도 검증이 필요하다.
4. **파라미터 프로퍼티에 접근제어자를 안 붙인다.** `constructor(celsius: number)`처럼 제어자가 없으면 그냥 지역 파라미터일 뿐, 필드가 생기지 않는다. 본문에서 `this.celsius`를 쓰면 "존재하지 않는 속성" 에러.

---

## 오늘 실습과의 연결

`exercises/day3-temperature.ts`의 `Temperature`를 구현한다.

- **생성자**: 이미 `constructor(private celsius: number)`로 축약이 주어져 있다. 본문에는 절대영도(`-273.15℃`) 미만 검증만 추가하면 된다(할당은 자동으로 끝난 상태).
- **`get c` / `set c`**: 섭씨 읽기/쓰기. setter에는 절대영도 검증을 넣는다. 거부되면 값이 유지돼야 한다.
- **`get f` / `set f`**: 위 3) 변환 패턴. `F = C * 9/5 + 32`, `C = (F - 32) * 5/9`. f setter는 변환 후에도 절대영도 검증을 거친다.
- 테스트가 `0℃ → 32℉`, `100℃ → 212℉`, `212℉ → 100℃`를 확인한다.

---

## 셀프 체크

1. `constructor(private celsius: number)`는 어떤 세 가지 작업을 자동으로 해주는가?
2. 파라미터 앞에 접근제어자를 **안** 붙이면 무슨 차이가 생기는가? 본문에서 `this.celsius`를 쓸 수 있는가?
3. `t.f`와 `t.f()`의 차이는? 후자는 왜 에러인가?
4. 화씨를 별도 필드로 저장하지 않고 getter로 매번 계산하면 어떤 이점이 있는가?
5. c setter에서 `-300`을 거부한 뒤 `t.c`를 읽으면 어떤 값이어야 하는가? 왜인가?
