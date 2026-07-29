# 스테이지 1 — 클래스 기초 (1주차)

> **학습 목표**: 클래스를 "타입이 있는 객체 공장"으로 자유롭게 만들 수 있다.
> NestJS 코드에서 가장 많이 보게 될 `constructor(private readonly ...)` 축약을 손에 익힌다.

이번 주는 TDD로 진행한다. 테스트는 이미 주어져 있고(`tests/`), 여러분은 `exercises/`의 `throw new Error('TODO: ...')`를 지우고 클래스를 구현해 테스트를 초록으로 만든다.

---

## 1. 이번 주에 배우는 개념

### 1) 클래스 선언 · 생성자 · 프로퍼티 · 메서드 (Day 1)

클래스는 "같은 모양의 객체를 찍어내는 틀"이다. `constructor`에서 초기 상태를 세팅하고, 메서드로 동작을 정의한다.

```ts
class Point {
  x: number;        // 프로퍼티(필드) 선언 — 타입 명시
  y: number;

  constructor(x: number, y: number) {
    this.x = x;     // this 로 인스턴스 프로퍼티에 접근
    this.y = y;
  }

  distanceFromOrigin(): number {   // 메서드
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}

const p = new Point(3, 4);
p.distanceFromOrigin(); // 5
```

### 2) 접근제어자 — 캡슐화 (Day 2)

| 제어자 | 의미 |
|---|---|
| `public` | 어디서나 접근 가능 (기본값) |
| `private` | 클래스 **내부에서만** 접근 가능 |
| `protected` | 클래스 내부 + 자식 클래스에서 접근 |
| `readonly` | 최초 할당 후 재할당 불가 (읽기 전용) |

핵심은 **캡슐화**: 상태를 `private`로 숨기고, 변경은 검증을 거친 메서드로만 허용한다.

```ts
class BankAccount {
  private balance: number;               // 외부에서 직접 못 바꿈

  constructor(initial: number) {
    this.balance = initial;
  }

  getBalance(): number { return this.balance; }

  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error('잔액 부족'); // 규칙을 강제
    this.balance -= amount;
  }
}

const acc = new BankAccount(1000);
// acc.balance = 999999;  // ❌ 컴파일 에러 — private
acc.withdraw(300);        // ✅ 메서드로만
```

### 3) 파라미터 프로퍼티 축약 · getter/setter (Day 3)

생성자 파라미터 앞에 접근제어자를 붙이면 **필드 선언 + `this` 할당이 자동**으로 이루어진다. NestJS 코드가 온통 이 문법이다.

```ts
// 이 축약은…
class Temperature {
  constructor(private celsius: number) {}
}

// 아래를 한 줄로 줄인 것과 같다.
class Temperature2 {
  private celsius: number;
  constructor(celsius: number) { this.celsius = celsius; }
}
```

`get`/`set` 접근자는 메서드를 프로퍼티처럼 쓰게 해준다. 내부 표현(섭씨)과 외부 인터페이스(화씨)를 분리할 때 유용하다.

```ts
class Temperature {
  constructor(private celsius: number) {}
  get f(): number { return this.celsius * 9 / 5 + 32; }  // t.f 로 읽음
  set f(v: number) { this.celsius = (v - 32) * 5 / 9; }  // t.f = 100 으로 씀
}
```

### 4) static 멤버 — 인스턴스 vs 클래스 레벨 (Day 4)

`static`은 인스턴스가 아니라 **클래스 자체**에 딱 하나 존재한다. 공유 카운터나 팩토리 메서드에 쓴다.

```ts
class User {
  private static count = 0;          // 모든 인스턴스가 공유
  public readonly id: number;

  constructor(public readonly name: string) {
    User.count += 1;                 // 클래스 이름으로 접근
    this.id = User.count;
  }

  static getCount(): number { return User.count; }   // 정적 메서드
  static fromString(s: string): User { return new User(s); } // 팩토리
}
```

### 5) 종합 — 도메인 클래스 설계 (Day 5)

위 개념을 하나의 작은 도메인(장바구니)에 모아 설계한다.

---

## 2. 왜 채용에 중요한가

국내 테크 기업·국내 테크 기업급 Node.js/TypeScript 서버 채용은 **NestJS + OOP/TDD 소양**을 본다. 그 실무 코드의 **기본형**이 바로 이번 주 문법이다.

```ts
@Injectable()
export class UserService {
  // 이 한 줄에 Day2(private/readonly) + Day3(파라미터 프로퍼티)가 다 들어 있다.
  constructor(private readonly userRepository: UserRepository) {}
}
```

- `private readonly service` 축약은 NestJS **의존성 주입(DI)**의 표준 표기다. 이걸 편하게 읽고 쓰지 못하면 프레임워크 코드가 마법처럼 보인다.
- `private`로 상태를 감추고 메서드로만 바꾸는 **캡슐화**는 Service/Repository 계층 설계의 토대다.
- 이번 주를 손에 익혀야 2주차(계약 설계) → 4주차(DI 원리) → 5주차(NestJS)가 매끄럽게 이어진다.

---

## 3. 일차별 문제 안내

| 일차 | 파일 | 주제 | 구현 대상 |
|---|---|---|---|
| Day 1 | `day1-point.ts` | 클래스 선언/생성자/메서드 | `Point` — 좌표, 거리 계산, 불변 이동 |
| Day 2 | `day2-bank-account.ts` | 접근제어자·캡슐화 | `BankAccount` — 잔액 private, 입출금 메서드 |
| Day 3 | `day3-temperature.ts` | 파라미터 프로퍼티·getter/setter | `Temperature` — 섭씨 내부저장, 화씨 변환 |
| Day 4 | `day4-user.ts` | static 멤버·팩토리 | `User` — 자동 id, 인스턴스 카운터, `fromString` |
| Day 5 | `day5-shopping-cart.ts` | 종합 도메인 설계 | `CartItem` / `ShoppingCart` — Day1~4 총동원 |

각 문제 파일에는 한국어 힌트 주석이 달려 있다. `throw new Error('TODO: ...')`를 지우고 힌트대로 채워 나가면 된다.

---

## 3-1. 학습 노트 (실습 전 30분 이론)

실습 파일을 열기 전에, 그날의 학습 노트를 먼저 읽어라. 노트는 문법과 동작 원리를 처음 배우는 사람 기준으로 설명하고, 실무·채용 연결과 흔한 함정, 셀프 체크까지 담고 있다. **답을 스포일러하지 않으므로** 안심하고 읽어도 된다.

| 일차 | 학습 노트 | 대응 실습 | 핵심 주제 |
|---|---|---|---|
| Day 1 | [notes/day1-point.md](notes/day1-point.md) | `day1-point.ts` | 클래스 선언·생성자·메서드, 불변 반환 |
| Day 2 | [notes/day2-bank-account.md](notes/day2-bank-account.md) | `day2-bank-account.ts` | 접근제어자·캡슐화, `readonly` |
| Day 3 | [notes/day3-temperature.md](notes/day3-temperature.md) | `day3-temperature.ts` | 파라미터 프로퍼티 축약, getter/setter |
| Day 4 | [notes/day4-user.md](notes/day4-user.md) | `day4-user.ts` | static 멤버, 정적 팩토리 |
| Day 5 | [notes/day5-shopping-cart.md](notes/day5-shopping-cart.md) | `day5-shopping-cart.ts` | 종합 도메인 설계, 방어적 복사 |

> **하루 루틴**: `notes/dayN-*.md` 읽기(이론 30분) → `exercises/dayN-*.ts` 구현(실습 60~90분).

---

## 4. 진행 방법

```bash
# 0) 오늘의 학습 노트를 먼저 읽는다 (이론 30분).
#    notes/dayN-*.ts 를 읽어 개념·함정·셀프체크를 훑고 실습에 들어간다.

# 1) 내 구현(exercises)을 채점한다 — 처음엔 대부분 실패(빨강)한다.
npm run check:stage1

# 2) 힌트를 보며 exercises/dayN-*.ts 의 TODO 를 구현한다.
#    한 파일씩, 테스트가 초록이 될 때까지 반복한다.

# 3) 20분 이상 막히면 solutions/ 의 같은 파일명을 열어 비교한다.
#    이해한 뒤 답안을 덮고 다시 스스로 작성해 본다.

# (참고) 모범 답안이 테스트를 통과하는지 확인하고 싶을 때
npm run check:stage1:answer   # 전체 통과해야 정상

# (참고) 저장소 전체 타입 체크
npm run typecheck
```

> **막혔을 때 순서**: 힌트 주석 다시 읽기 → 테스트 파일(`tests/dayN-*.test.ts`)에서 기대 동작 확인 → `solutions/` 비교.
> 테스트 파일은 "이 클래스가 어떻게 쓰여야 하는가"의 명세다. 막히면 테스트부터 읽어라.

**완료 기준**: `npm run check:stage1` 전체 통과 + `PROGRESS.md` 체크.

### 참고 — `@ts-expect-error` 테스트

일부 테스트에는 `// @ts-expect-error` 주석이 있다. 이는 "이 줄은 **컴파일 에러가 나야 정상**"이라는 뜻이다. 예를 들어 `private` 필드에 외부에서 접근하면 TypeScript가 막아야 하는데, 그 막힘 자체를 검증한다. 여러분이 접근제어자를 올바르게 붙이지 않으면 이 테스트가 오히려 실패하니, 접근제어자를 힌트대로 정확히 선언하라.
