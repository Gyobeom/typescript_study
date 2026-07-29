# Day 2 — 접근제어자 · 캡슐화

> 실습 파일: `exercises/day2-bank-account.ts` · 테스트: `tests/day2-bank-account.test.ts`
> 이론 30분 → 실습 60~90분

---

## 오늘의 학습 목표

이 노트를 다 읽으면 다음을 할 수 있다.

1. `public` / `private` / `protected` / `readonly` 네 가지 제어자의 의미와 차이를 설명할 수 있다.
2. **캡슐화**가 무엇이고 왜 필요한지, 코드로 그 효과를 보일 수 있다.
3. `private` 필드에 외부에서 접근하면 나는 컴파일 에러를 읽고 고칠 수 있다.
4. 상태를 숨기고 "검증을 통과한 메서드로만" 바꾸는 패턴을 작성할 수 있다.
5. `readonly`가 "재할당 금지"이지 "완전한 불변"이 아님을 구분할 수 있다.

---

## 개념 설명

### 1) 접근제어자 네 가지

클래스 멤버 앞에 붙여 "누가 이걸 만질 수 있는가"를 정한다.

| 제어자 | 접근 가능 범위 | 언제 쓰나 |
|---|---|---|
| `public` | 어디서나 (기본값) | 외부에 공개할 API |
| `private` | **그 클래스 내부에서만** | 숨기고 싶은 내부 상태 |
| `protected` | 그 클래스 + 상속받은 자식 클래스 | 자식에게만 물려줄 것 |
| `readonly` | (접근 범위가 아니라) 최초 할당 후 **재할당 금지** | 생성 후 안 바뀌는 값 |

`readonly`는 나머지 셋과 축이 다르다. `public readonly`, `private readonly`처럼 **조합**해서 쓴다. "누가 보느냐(public/private)"와 "바꿀 수 있느냐(readonly)"는 별개 질문이기 때문이다.

```ts
// 실습과 다른 도메인(사원증)으로 예시
class Employee {
  public readonly badgeId: string; // 밖에서 읽기 O, 재할당 X
  private salary: number; // 밖에서 접근 자체가 X

  constructor(badgeId: string, salary: number) {
    this.badgeId = badgeId;
    this.salary = salary;
  }

  getSalary(): number {
    return this.salary; // 내부에서는 자유롭게 접근
  }
}

const e = new Employee('E-100', 5000);
console.log(e.badgeId); // 'E-100'  ✅ public 이라 읽힘
// e.badgeId = 'E-200';  ❌ readonly
// e.salary;             ❌ private
```

### 2) 캡슐화 — "왜" 숨기는가

캡슐화는 **상태를 숨기고, 정해진 통로(메서드)로만 바꾸게 하는 것**이다. 목적은 "규칙을 강제"하는 데 있다.

`private` 없이 필드를 열어두면 어떤 일이 벌어지는지 보자.

```ts
class OpenWallet {
  balance: number = 0; // 아무나 만질 수 있음
}

const w = new OpenWallet();
w.balance = -99999; // 아무 검증 없이 음수 잔액! 말이 안 되는 상태
```

`balance`가 음수가 되는 건 도메인상 있어선 안 되는 일이다. 하지만 필드가 열려 있으면 아무 데서나 이런 값을 넣어버릴 수 있고, 나중에 "왜 잔액이 음수지?" 하고 온 코드를 뒤지게 된다.

`private` + 메서드로 닫으면 이 문제가 원천 차단된다.

```ts
class SafeWallet {
  private balance: number = 0; // 밖에서 직접 못 바꿈

  charge(amount: number): void {
    if (amount <= 0) throw new Error('충전액은 0보다 커야 합니다');
    this.balance += amount; // 검증을 통과해야만 변경됨
  }

  getBalance(): number {
    return this.balance; // 읽기만 노출
  }
}

const s = new SafeWallet();
// s.balance = -99999;   ❌ 컴파일 에러 — 잘못된 상태를 만들 길이 막힘
s.charge(1000); // ✅ 검증을 거친 정상 경로
```

핵심: **잘못된 상태를 애초에 만들 수 없게** 만드는 것이 캡슐화의 힘이다.

### 3) `private` 접근 시 컴파일 에러

```ts
const s = new SafeWallet();
s.balance = 500;
```

```
error TS2341: Property 'balance' is private and only
accessible within class 'SafeWallet'.
```

"balance는 private이라 SafeWallet 클래스 내부에서만 접근 가능하다"는 뜻이다. 오늘 테스트에는 이 에러가 **나야 정상**인 줄(`// @ts-expect-error`)이 있다. 즉 당신이 `balance`를 `private`으로 제대로 선언하지 않으면, 그 에러가 안 나서 오히려 테스트가 실패한다.

### 4) `readonly`의 정확한 의미

`readonly`는 "**재할당** 금지"다. "그 값이 담은 내용까지 얼어붙는" 것은 아니다.

```ts
class Team {
  readonly members: string[] = [];
}

const t = new Team();
// t.members = [];          ❌ 재할당 금지 (TS2540)
t.members.push('Alice'); // ✅ 배열 내용 변경은 막지 못함
```

오늘 실습에선 `accountNumber`가 `readonly`다. "계좌번호는 생성 후 절대 안 바뀐다"는 도메인 규칙을 타입으로 못 박는 것이다. 재할당 시도는 이렇게 막힌다.

```
error TS2540: Cannot assign to 'accountNumber' because it
is a read-only property.
```

---

## 실무 · 채용 연결

- 캡슐화는 **Service/Repository 계층 설계의 토대**다. NestJS Service는 대개 내부 상태(주입받은 의존성, 캐시 등)를 `private`으로 감추고, `public` 메서드만 유스케이스로 노출한다.
- "필드를 함부로 열지 마라"는 코드 리뷰의 단골 지적이다. 잘못된 상태 조합을 컴파일 타임에 막는 설계는 시니어의 기본기로 본다.
- `readonly`로 불변 필드를 표시하는 습관은 엔티티/DTO 설계에서 **의도를 문서화**하는 효과가 있다. "이 값은 안 바뀐다"가 타입에 드러난다.

---

## 흔한 실수와 함정

1. **`private`을 안 붙이고 캡슐화했다고 착각.** 필드가 `public`(기본값)이면 밖에서 다 바뀐다. 반드시 명시적으로 `private`.
2. **`readonly`면 내용도 못 바꾼다고 오해.** 위 3)처럼 배열/객체의 내부는 `readonly`로 막지 못한다. 재할당만 막힌다.
3. **검증을 생성자에만 넣고 메서드에는 빼먹는다.** 생성 시엔 음수를 막았는데 출금/입금 메서드에서 안 막으면, 결국 잘못된 상태에 도달한다. 상태를 바꾸는 **모든 통로**에 규칙을 넣어야 한다.
4. **에러를 던져야 할 자리에서 조용히 무시.** "잔액 부족"인데 그냥 리턴해버리면 호출자는 실패를 모른다. `throw new Error(...)`로 명확히 실패를 알린다.

---

## 오늘 실습과의 연결

`exercises/day2-bank-account.ts`의 `BankAccount`를 구현한다.

- **`balance`는 `private`**: 위 2) 캡슐화. 외부 직접 접근을 막아야 `@ts-expect-error` 테스트가 통과한다.
- **`accountNumber`는 `public readonly`**: 밖에서 읽되 재할당은 금지. 이 역시 `@ts-expect-error`로 검증된다.
- **생성자 검증**: `initialBalance`가 음수면 `throw`. 단, 유효한 값은 정상 생성돼야 한다(무조건 throw하는 스켈레톤은 실패).
- **`deposit` / `withdraw`**: 상태를 바꾸는 모든 통로에 규칙을 건다. 0 이하 금액 거부, 잔액 초과 출금 거부. 거부 시 잔액은 그대로 유지돼야 한다.

---

## 셀프 체크

1. `private`과 `readonly`의 차이를 한 문장씩으로 설명해보라. `public readonly`는 왜 모순이 아닌가?
2. 필드를 `private`으로 감추는 것이 "잘못된 상태를 원천 차단한다"는 말은 무슨 뜻인가? 열린 필드일 때 어떤 문제가 생기는가?
3. `readonly members: string[]` 에서 `members.push(x)`는 되고 `members = []`는 안 되는 이유는?
4. 생성자에서만 음수를 검증하고 `withdraw`에서 검증을 빼면 어떤 방식으로 무결성이 깨질 수 있는가?
5. `// @ts-expect-error` 주석이 붙은 줄은 컴파일 에러가 나야 통과인가, 안 나야 통과인가?
