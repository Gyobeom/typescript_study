# 스테이지 2 — 계약 설계 (interface · 추상 클래스 · 조합 · SOLID)

> **한 줄 목표**: "구현이 아니라 **계약(추상)** 에 의존하는" 코드를 손에 익힌다.
> 상속보다 **조합**을 판단 기준으로 삼고, SOLID를 코드로 체감한다.

---

## 1. 개념

### 1-1. interface = "계약"

인터페이스는 "이 모양을 지켜라"는 **계약서**다. 무엇을(what) 해야 하는지만 규정하고,
어떻게(how) 하는지는 각 클래스가 알아서 구현한다.

```ts
interface PaymentMethod {
  readonly name: string;
  pay(amount: number): PaymentResult;
}

class CreditCardPayment implements PaymentMethod { /* 카드 방식 */ }
class MobilePayPayment  implements PaymentMethod { /* 간편결제 방식 */ }
```

핵심은 **사용하는 쪽**이다. `checkout(method: PaymentMethod, amount)` 는 카드인지
간편결제인지 **모른다**. 오직 `PaymentMethod` 계약만 안다. 그래서 결제 수단을
100개 추가해도 `checkout`은 한 줄도 안 바뀐다. 이게 **다형성**이다.

### 1-2. 추상 클래스 = 계약 + 부분 구현

인터페이스는 구현을 하나도 못 담는다. **추상 클래스**는 공통 흐름(부분 구현)은
자기가 갖고, 달라지는 세부만 `abstract`로 비워 하위 클래스에 위임할 수 있다.

```ts
abstract class ReportGenerator {
  // 템플릿 메서드: 흐름은 고정
  generate(title: string, rows: ReportRow[]): string {
    return [this.formatHeader(title), ...rows.map(r => this.formatRow(r)), this.formatFooter(rows)].join('\n');
  }
  // 세부는 하위 클래스가 채운다
  protected abstract formatHeader(title: string): string;
  protected abstract formatRow(row: ReportRow): string;
  protected abstract formatFooter(rows: ReportRow[]): string;
}
```

이 "흐름은 부모가, 빈칸은 자식이" 구조를 **템플릿 메서드 패턴**이라 부른다.

### 1-3. 상속 vs 조합 — **왜 조합인가**

로그를 남기고 싶다고 `class NotificationService extends Logger` 로 상속하면:

- **강하게 묶인다(is-a).** 알림 서비스가 "로거의 일종"이 되어 버린다 (말이 안 된다).
- **교체가 어렵다.** 로그를 파일→원격으로 바꾸려면 부모 클래스를 갈아야 한다.
- **막힌다.** TS/JS는 다중 상속이 없어서 다른 기능도 상속으로 붙이려면 못 붙인다.

조합은 **has-a**다. "알림 서비스는 로거를 **가진다**(주입받는다)":

```ts
class NotificationService {
  constructor(private readonly logger: Logger) {}   // Logger 계약을 주입
  send(n: Notification) { this.logger.log(...); }
}
```

이러면 (1) 테스트에서 **가짜 로거**를 꽂아 검증할 수 있고, (2) 콘솔/파일/원격 로거로
**갈아끼워도** `NotificationService`는 그대로다. 실무가 조합을 선호하는 이유다.
경험칙: **"A는 B다"면 상속, "A는 B를 가진다/쓴다"면 조합.**

### 1-4. SOLID (이번 주는 SRP · OCP · DIP)

- **SRP (단일 책임)**: 한 클래스는 "바뀌는 이유"를 하나만 가져야 한다.
  거대 클래스를 검증/계산/저장 등 책임별로 쪼갠다.
- **OCP (개방-폐쇄)**: 확장에는 열리고, 수정에는 닫혀야 한다.
  할인 종류가 늘 때마다 `switch`에 `case`를 더하는 대신, 각 할인을
  `DiscountPolicy` 구현체로 만든다 → 새 할인은 **새 클래스 추가**로 끝난다.
- **DIP (의존 역전)**: 고수준 모듈이 **구체가 아니라 추상**에 의존해야 한다.
  `PriceCalculator`가 `RateDiscount`(구체)가 아니라 `DiscountPolicy`(추상)에 의존.

#### DIP가 "DI의 D"인 이유

- **DIP**(원칙): "구체 말고 추상에 의존하라"는 **설계 규칙**.
- **DI**(기법): 그 추상의 실제 구현체를 **밖에서 넣어주는** 방법 = **의존성 주입**.

즉 DIP는 "무엇을 지켜야 하나"(원칙)이고, DI는 "어떻게 지키나"(수단)다. 생성자로
인터페이스를 받아 구현체를 주입하면 → 코드는 추상에 의존하고(DIP 달성),
구현체는 밖에서 갈아끼운다(DI). 이게 **NestJS의 `constructor(private x: XService)`**
정확히 그것이다. stage4에서 이 주입을 직접 구현하는 미니 DI 컨테이너를 만든다.

---

## 2. 채용 연관성

- 국내 서버 개발 공고의 우대사항에 "객체지향 설계에 대한 이해", "TDD"가 자주 등장한다.
  이번 주 내용(계약·다형성·SOLID·조합)이 그 "OOP 설계 소양"의 핵심이다.
- **NestJS 전체 구조가 "구현이 아니라 추상에 의존"** 이다. Controller는 Service
  인터페이스에, Service는 Repository 추상에 의존하고, 실제 구현은 DI로 주입된다.
  이번 주 `CheckoutService`(Day5)가 바로 그 축소판이다.
- 면접에서 "상속과 조합의 차이", "DI/IoC가 뭐냐", "SOLID 예시 들어보라"는 단골
  질문이다. 코드로 만들어 본 사람과 외운 사람은 답이 다르다.

---

## 3. 일차별 문제

| 일차 | 파일 | 주제 | 만들어 볼 것 |
|---|---|---|---|
| 1 | `day1-payment-method.ts` | interface와 implements | `PaymentMethod` 하나를 카드·모바일페이·포인트 세 클래스로 다르게 구현 |
| 2 | `day2-report-generator.ts` | 추상 클래스 템플릿 메서드 | 흐름은 `ReportGenerator`가, 세부는 CSV/Markdown 하위 클래스가 |
| 3 | `day3-composition.ts` | 상속 vs 조합 | `Logger`를 상속하지 말고 주입받는 `NotificationService` |
| 4 | `day4-solid.ts` | SOLID (SRP/OCP/DIP) | `switch` 할인 → `DiscountPolicy` 다형성, 거대 클래스 → 검증/계산 분리 |
| 5 | `day5-contract-design.ts` | 종합 — 계약 기반 설계 | 세 계약에만 의존하는 `CheckoutService` + 교체 가능한 구현체들 |

각 파일은 **계약(interface/abstract)은 이미 채워져** 있다. 여러분은 그 계약을
**구현**한다. 미구현 부분은 `throw new Error('TODO: ...')` 로 되어 있고, 위에 한국어
힌트 주석이 붙어 있다.

> 실습에 들어가기 전에 아래 **4. 학습 노트**에서 해당 일차의 노트를 먼저 읽는다.

---

## 4. 학습 노트 (실습 전에 읽기)

각 일차의 실습을 시작하기 **전에** 같은 이름의 학습 노트를 먼저 읽는다.
노트는 이론 30분 분량으로, 그날 개념의 **동작 원리**와 **채용 연결·흔한 함정**을 담았다
(실습 답은 노출하지 않는다 — 힌트 수준). 하루 루틴: **노트 읽기(30분) → 실습(60~90분)**.

| 일차 | 학습 노트 | 실습 파일 |
|---|---|---|
| 1 | [day1-payment-method.md](notes/day1-payment-method.md) | `exercises/day1-payment-method.ts` |
| 2 | [day2-report-generator.md](notes/day2-report-generator.md) | `exercises/day2-report-generator.ts` |
| 3 | [day3-composition.md](notes/day3-composition.md) | `exercises/day3-composition.ts` |
| 4 | [day4-solid.md](notes/day4-solid.md) | `exercises/day4-solid.ts` |
| 5 | [day5-contract-design.md](notes/day5-contract-design.md) | `exercises/day5-contract-design.ts` |

---

## 5. 진행 방법

```bash
# 0) 오늘 일차의 학습 노트(notes/dayN-*.md)를 먼저 읽는다 (이론 30분).

# 1) 내 구현(exercises)을 채점 — 처음엔 다 실패(빨강)한다. 정상이다.
npm run check:stage2

# 2) day1 파일의 TODO를 힌트대로 구현한다.
#    (파일: stages/stage2-contracts/exercises/day1-payment-method.ts)

# 3) 다시 채점 → 초록이 될 때까지 반복.
npm run check:stage2

# 4) 모범 답안이 맞는지 확인하고 싶으면 (테스트 자체 검증용):
npm run check:stage2:answer   # 전부 통과해야 정상

# 5) 저장소 전체 타입 체크 (strict)
npm run typecheck
```

- **테스트는 `@stage2/<파일명>` 경로로 import** 한다. `TARGET` 환경변수에 따라
  같은 테스트가 `exercises`(내 구현) 또는 `solutions`(답안)를 대상으로 돈다.
- **20분 이상 막히면** `solutions/`의 같은 파일명을 열어 **비교**하며 이해하고,
  답안을 덮고 다시 스스로 작성한다. 답을 베끼는 게 아니라 흐름을 이해하는 게 목적.
- 다 끝나면 `PROGRESS.md`에 체크하고 오늘 배운 걸 한 줄 남긴다.
