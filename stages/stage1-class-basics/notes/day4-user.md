# Day 4 — static 멤버 · 인스턴스 vs 클래스 레벨

> 실습 파일: `exercises/day4-user.ts` · 테스트: `tests/day4-user.test.ts`
> 이론 30분 → 실습 60~90분

---

## 오늘의 학습 목표

이 노트를 다 읽으면 다음을 할 수 있다.

1. `static` 멤버가 "인스턴스가 아니라 클래스 자체"에 속한다는 뜻을 설명할 수 있다.
2. 인스턴스 레벨 필드와 클래스 레벨(static) 필드가 각각 몇 개 존재하는지 구분할 수 있다.
3. 공유 카운터로 인스턴스마다 자동 증가하는 id를 부여할 수 있다.
4. 정적 팩토리 메서드(`static create...`)가 무엇이고 왜 쓰는지 안다.
5. 테스트 격리를 위한 static 상태 초기화가 왜 필요한지 이해한다.

---

## 개념 설명

### 1) 인스턴스 레벨 vs 클래스 레벨

일반 필드는 **인스턴스마다 따로** 존재한다. 인스턴스를 100개 만들면 그 필드도 100개다.

`static` 필드는 **클래스 자체에 딱 하나** 존재한다. 인스턴스를 100개 만들어도 static 필드는 1개고, 모든 인스턴스가 그 하나를 공유한다.

```ts
// 실습과 다른 도메인(티켓)으로 예시
class Ticket {
  static issued: number = 0; // 클래스에 하나 — 발급된 티켓 총 수
  seat: number; // 인스턴스마다 하나 — 이 티켓의 좌석

  constructor(seat: number) {
    this.seat = seat;
    Ticket.issued += 1; // 클래스 이름으로 접근 (this 아님!)
  }
}

const a = new Ticket(1);
const b = new Ticket(2);
console.log(a.seat, b.seat); // 1 2   (각자 다름 — 인스턴스 레벨)
console.log(Ticket.issued); // 2       (공유되는 하나 — 클래스 레벨)
```

핵심 포인트: static 멤버는 `this.issued`가 아니라 **`Ticket.issued`**, 즉 **클래스 이름**으로 접근한다. `this`는 인스턴스를 가리키므로 static에는 쓰지 않는다.

| | 접근 방법 | 몇 개 존재 | 예시 |
|---|---|---|---|
| 인스턴스 필드 | `this.seat` | 인스턴스 수만큼 | 각 티켓의 좌석 |
| static 필드 | `Ticket.issued` | 항상 1개 | 발급된 총 수 |

### 2) 자동 증가 id 부여

"공유 카운터"의 대표 용도다. 클래스 레벨 카운터를 하나 두고, 인스턴스가 생길 때마다 증가시켜 각 인스턴스에 유일한 번호를 준다.

```ts
class Order {
  private static nextNo: number = 1; // 다음에 줄 번호 (공유)
  readonly orderNo: number; // 이 주문의 번호 (고유)

  constructor() {
    this.orderNo = Order.nextNo; // 지금 값을 내 번호로
    Order.nextNo += 1; // 다음을 위해 증가
  }
}

const o1 = new Order();
const o2 = new Order();
console.log(o1.orderNo, o2.orderNo); // 1 2
```

`orderNo`가 `readonly`인 것도 눈여겨보라. 생성자 안에서는 대입할 수 있지만(그때 딱 한 번), 이후엔 바뀌지 않는다.

### 3) 정적 메서드 · 정적 팩토리

`static` 메서드는 인스턴스 없이 **클래스 이름으로** 호출한다. 공유 상태를 읽거나, 특별한 방식으로 인스턴스를 만들 때 쓴다.

```ts
class Order {
  private static nextNo = 1;
  private static count = 0;
  constructor(readonly orderNo: number) {}

  static getCount(): number {
    // 인스턴스 없이 Order.getCount()
    return Order.count;
  }
}
```

**정적 팩토리 메서드**는 `new` 대신 쓰는 "이름 있는 생성자"다. 원시 문자열/데이터를 받아 파싱한 뒤 인스턴스를 만들어 돌려준다.

```ts
class Color {
  constructor(
    public r: number,
    public g: number,
    public b: number,
  ) {}

  // "#ff8800" 같은 hex 문자열에서 Color 를 만드는 팩토리
  static fromHex(hex: string): Color {
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!m) throw new Error(`잘못된 hex 형식: ${hex}`);
    return new Color(
      parseInt(m[1], 16),
      parseInt(m[2], 16),
      parseInt(m[3], 16),
    );
  }
}

const c = Color.fromHex('#ff8800'); // new 대신 의미 있는 이름으로
```

팩토리를 쓰면 "어떤 방식으로 만드는지"가 메서드 이름에 드러나고(`fromHex`, `fromString`), 파싱 실패 같은 검증을 한 곳에 모을 수 있다.

### 4) 테스트 격리 — static 상태의 함정

static 상태는 **테스트 사이에 살아남는다**. 카운터는 클래스에 하나뿐이라, 앞 테스트에서 인스턴스를 만들면 그 값이 다음 테스트로 넘어간다.

```ts
// 테스트 A 에서 Order 를 3개 만들었다면...
// 테스트 B 에서 Order.getCount() 는 0 이 아니라 3 일 수 있다!
```

그래서 학습용으로 `resetCounter()` 같은 초기화 정적 메서드를 두고, 각 테스트 `beforeEach`에서 호출해 상태를 되돌린다. (실무에선 전역 가변 상태 자체를 지양하지만, static의 동작을 체감하기 좋은 예다.)

### 5) 컴파일 에러 미리 보기

`private static`을 외부에서 만지면 Day2와 같은 에러가 난다.

```
error TS2341: Property 'count' is private and only
accessible within class 'User'.
```

또 static 필드를 `this`로 접근하려 하면 이런 에러를 만날 수 있다.

```
error TS2576: Property 'count' does not exist on type 'User'.
Did you mean to access the static member 'User.count' instead?
```

"`this.count`가 아니라 `User.count`를 쓰려던 것 아니냐"고 친절히 알려준다.

---

## 실무 · 채용 연결

- **정적 팩토리 메서드**는 실무에서 매우 흔하다. `User.fromEntity(row)`, `Money.fromWon(1000)`, `Result.ok(value)` 처럼 "생성 의도를 이름으로 드러내는" 패턴이다. 면접에서 "생성자 대신 팩토리를 언제 쓰나요?"는 나올 수 있는 질문이다.
- static 공유 상태는 **양날의 검**이다. 편리하지만 테스트를 어렵게 하고(위 4번) 전역 상태 문제를 낳는다. NestJS가 DI로 의존성을 주입하는 이유 중 하나가 바로 이 전역 static 상태를 피하기 위해서다. 오늘 static을 겪어봐야 4주차(DI 원리)에서 "왜 DI가 낫나"를 체감할 수 있다.

---

## 흔한 실수와 함정

1. **static 필드를 `this`로 접근.** 생성자에서 `this.count += 1`은 인스턴스 필드를 찾아 에러(TS2576). `User.count += 1`이 맞다.
2. **id를 부여한 뒤 카운터 증가를 빼먹거나 순서를 헷갈린다.** "지금 값을 내 id로 → 그다음 증가"의 순서를 지켜야 1, 2, 3...이 된다.
3. **팩토리에서 검증 실패 시 throw를 안 한다.** 형식이 안 맞으면 `throw`. 안 그러면 잘못된 데이터로 인스턴스가 만들어진다.
4. **테스트 격리를 잊는다.** static 카운터를 `beforeEach`에서 리셋하지 않으면, 앞 테스트가 남긴 값 때문에 뒤 테스트가 깨진다.

---

## 오늘 실습과의 연결

`exercises/day4-user.ts`의 `User`를 구현한다.

- **`nextId` / `count`는 `private static`**: 위 1) 공유 카운터. `count`는 외부 접근이 막혀야 `@ts-expect-error` 테스트가 통과한다.
- **생성자**: 위 2) 자동 id. `this.id`에 `User.nextId`를 부여하고 `nextId`, `count`를 증가시킨다. `id`는 `readonly`라 생성자 안에서만 대입 가능.
- **`static getCount`**: 공유 `count`를 반환.
- **`static fromString`**: 위 3) 정적 팩토리. 정규식 `/^(.+?)\s*<(.+?)>$/`로 `"이름 <이메일>"`을 파싱. 실패 시 throw.
- **`static resetCounter`**: 위 4) 테스트 격리. `nextId=1`, `count=0`으로 되돌린다. 테스트의 `beforeEach`가 이걸 호출한다.

---

## 셀프 체크

1. 인스턴스를 5개 만들었을 때, 일반 필드와 static 필드는 각각 메모리에 몇 개 존재하는가?
2. 생성자 안에서 카운터를 증가시킬 때 `this.count`와 `User.count` 중 무엇을 쓰는가? 다른 쪽을 쓰면 어떤 에러가 나는가?
3. `id`가 `readonly`인데도 생성자에서 대입할 수 있는 이유는?
4. 정적 팩토리 메서드(`fromString`)를 생성자 대신 쓰면 어떤 이점이 있는가?
5. `resetCounter` 같은 초기화가 왜 테스트에 필요한가? 없으면 어떤 문제가 생기는가?
