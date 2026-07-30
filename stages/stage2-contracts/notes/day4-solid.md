# Day 4 학습 노트 — SOLID 입문 (SRP / OCP / DIP)

> 이론 30분용 노트. 다 읽고 나서 `exercises/day4-solid.ts`를 연다.
> 예시 도메인은 실습(주문·할인)과 다르게 **배송비·알림 라우팅** 등으로 잡았다. 위반 코드 → 개선 코드 대비에 집중하라.

---

## 오늘의 학습 목표

1. SOLID 다섯 글자가 무엇의 약자인지 알고, 오늘 다루는 **SRP·OCP·DIP** 를 구분한다.
2. 각 원칙의 **위반 코드 → 개선 코드** 대비를 스스로 그린다.
3. `switch` 분기가 왜 OCP 위반인지, 다형성으로 어떻게 푸는지 이해한다.
4. **DIP → DI** 연결, 즉 "추상에 의존하라"는 원칙이 "구현을 밖에서 주입"으로 실현됨을 안다.
5. 거대 클래스를 책임별로 쪼갤 때의 판단 기준("바뀌는 이유")을 익힌다.

---

## 개념 설명

### SOLID란

- **S**RP — 단일 책임 원칙 (Single Responsibility)
- **O**CP — 개방-폐쇄 원칙 (Open-Closed)
- **L**SP — 리스코프 치환 원칙 (다음 스테이지)
- **I**SP — 인터페이스 분리 원칙 (다음 스테이지)
- **D**IP — 의존 역전 원칙 (Dependency Inversion)

오늘은 **SRP, OCP, DIP** 세 개. 셋은 서로 얽혀 있어서 하나를 지키면 나머지도 딸려온다.

---

### 1. SRP — 한 클래스는 "바뀌는 이유"를 하나만

SRP의 정확한 정의는 "한 클래스는 **변경의 이유가 하나**여야 한다"이다. "기능이 하나"가 아니라 **"바뀔 이유가 하나"** 다.

**위반 코드** — 한 클래스가 검증·계산·저장·알림을 다 함:

```ts
class ShippingManager {
  process(order: Order) {
    // (1) 검증
    if (order.weight <= 0) throw new Error('무게 오류');
    // (2) 배송비 계산
    const fee = order.weight * 500;
    // (3) 저장
    db.save(order);
    // (4) 알림
    mailer.send('배송 시작');
  }
}
```

이 클래스는 **네 가지 이유로 바뀐다**: 검증 규칙이 바뀌어도, 요금 정책이 바뀌어도, DB가 바뀌어도, 알림 채널이 바뀌어도 이 파일을 연다. 변경이 서로 충돌하고 테스트가 거대해진다.

**개선 코드** — 책임별로 분리:

```ts
class ShippingValidator { validate(o: Order): void { /* 검증만 */ } }
class ShippingFeeCalculator { calc(o: Order): number { /* 계산만 */ } }

class ShippingManager {
  constructor(
    private readonly validator: ShippingValidator,
    private readonly calculator: ShippingFeeCalculator,
  ) {}
  process(o: Order): number {
    this.validator.validate(o);        // 검증은 위임
    return this.calculator.calc(o);    // 계산도 위임
  }
}
```

이제 `ShippingManager`는 "흐름 조율"만 책임진다. 검증 규칙이 바뀌면 `ShippingValidator`만, 요금이 바뀌면 `ShippingFeeCalculator`만 연다. **변경이 격리**된다.

---

### 2. OCP — 확장에는 열리고, 수정에는 닫혀라

새 기능이 늘 때 **기존 코드를 고치지 말고, 새 코드를 추가**하는 것으로 끝나야 한다.

**위반 코드** — 종류가 늘 때마다 `switch`에 `case` 추가:

```ts
function shippingFee(kind: string, weight: number): number {
  switch (kind) {
    case 'standard': return weight * 500;
    case 'express':  return weight * 900;
    // 'overnight'가 생기면? 여기를 또 열어서 고친다 ← 수정에 열려 있음(위반)
    default: throw new Error('알 수 없는 배송');
  }
}
```

배송 종류가 늘 때마다 이 함수를 **수정**해야 한다. 고칠 때마다 기존 케이스를 깨뜨릴 위험이 생긴다.

**개선 코드** — 각 종류를 계약의 구현체로:

```ts
interface ShippingPolicy {
  readonly name: string;
  fee(weight: number): number;
}
class StandardShipping implements ShippingPolicy {
  readonly name = 'standard';
  fee(w: number) { return w * 500; }
}
class ExpressShipping implements ShippingPolicy {
  readonly name = 'express';
  fee(w: number) { return w * 900; }
}
// 'overnight'가 생기면? 새 클래스 하나 추가로 끝. 기존 코드는 안 건드린다.

function shippingFee(policy: ShippingPolicy, weight: number): number {
  return policy.fee(weight); // switch가 사라졌다
}
```

새 배송 종류 = **새 클래스 추가**. 기존 `shippingFee`와 다른 정책들은 한 줄도 안 바뀐다. 이게 OCP다. 그리고 이 해법은 Day1의 **다형성**이 그대로 쓰인 것이다.

---

### 3. DIP — 고수준은 구체가 아니라 추상에 의존하라

위 개선 코드의 `shippingFee`를 다시 보자. 이 함수는 `StandardShipping`(구체)이 아니라 `ShippingPolicy`(추상)에 의존한다. **고수준 로직이 저수준 구체 구현을 모른다** — 이게 DIP다.

"역전(inversion)"인 이유: 보통은 고수준이 저수준을 직접 부른다(고수준 → 구체). DIP는 그 사이에 **추상(인터페이스)** 을 끼워, 양쪽이 모두 추상에 의존하게 만든다:

```
[위반]   PriceCalc ────────────────▶ RateDiscount(구체)
[DIP]    PriceCalc ──▶ DiscountPolicy(추상) ◀── RateDiscount(구체)
```

화살표 방향이 뒤집혔다. 구체가 추상 쪽을 향한다. 그래서 "의존 역전"이다.

### 4. DIP → DI: 원칙과 수단

- **DIP**(원칙): "구체 말고 추상에 의존하라"는 **설계 규칙**.
- **DI**(기법): 그 추상의 **실제 구현체를 밖에서 넣어주는** 방법 = 의존성 주입.

```ts
class PriceCalc {
  constructor(private readonly policy: ShippingPolicy) {} // 추상에 의존(DIP)
  //                        ▲ 구현체는 밖에서 주입(DI)
}
new PriceCalc(new StandardShipping()); // 구현체를 갈아끼운다
```

생성자로 인터페이스를 받으면 → 코드는 추상에 의존하고(**DIP 달성**), 구현체는 밖에서 갈아끼운다(**DI**). Day3의 조합이 여기로 이어진다. 그리고 이게 **NestJS의 `constructor(private x: XService)`** 정확히 그것이다.

---

## 실무·채용 연결

- **채용 우대사항 "객체지향 설계 이해"**의 핵심 채점 포인트가 SOLID다. "SOLID 예시를 들어보라"는 면접에서, 외운 정의가 아니라 **위반 → 개선 코드**를 즉석에서 그리면 확실히 앞선다.
- 실무에서 `switch`/`if-else`가 길어지는 순간이 OCP 리팩터링 신호다. "전략 패턴(Strategy)"이라는 이름으로 자주 등장한다 — 각 분기를 정책 객체로 뽑는 것.
- DIP는 **테스트 용이성과 직결**된다. 고수준이 추상에 의존하면 테스트에서 가짜 구현을 주입할 수 있다. TDD 문화가 있는 팀이 DIP를 강조하는 이유다.
- NestJS·Spring 같은 프레임워크는 **DI 컨테이너**로 이 주입을 자동화한다. 원리를 알면 프레임워크의 "왜"가 보인다.

---

## 흔한 실수와 함정

1. **SRP를 "메서드 하나만 두라"로 오해** — SRP는 메서드 수가 아니라 **변경 이유**의 문제다. 관련된 여러 메서드가 한 이유로 바뀌면 한 클래스에 있어도 된다.
2. **OCP 한다고 인터페이스를 과하게 만듦** — 아직 종류가 하나뿐인데 미리 정책 인터페이스를 파면 과설계다. **변화가 실제로 오는 축**에만 추상을 둬라.
3. **DIP를 구체 타입으로 주입해 무력화** — 생성자로 받되 타입이 구체 클래스면 DIP가 아니다. 반드시 **인터페이스 타입**으로 받아라(Day3 함정과 동일).
4. **분리해놓고 다시 강결합** — 계산기를 뽑았는데 그 안에서 특정 구체 정책을 `new`로 직접 만들면 도로 묶인다. 협력자는 주입받아라, 내부에서 생성하지 마라.
5. **음수·경계 처리 누락** — 할인/차감 계산에서 결과가 음수가 될 수 있는 경계를 놓치기 쉽다. "최종값은 0 미만이 될 수 없다" 같은 규칙을 계산 마지막에 방어하라.

---

## 오늘 실습과의 연결

`exercises/day4-solid.ts`는 두 갈래다.

- **[A] OCP + DIP**: 여러 정책을 **하나의 계약**으로 구현하고, 계산기는 그 **추상에만** 의존하게 만든다. 위 배송 정책 예시가 그대로 대응된다 — 계산기는 어떤 구체 정책이 들어오는지 몰라야 한다.
- **[B] SRP**: "검증"과 "총액 계산"을 각각 다른 클래스가 맡고, 상위 처리기는 둘을 **주입받아 조율**만 한다. 위 `ShippingManager` 개선 코드의 구도다.
- 정책 구현 중 하나는 **상한(cap)** 이 있다. 계산 결과에 상한/하한을 씌우는 경계 처리를 놓치지 마라(함정 5번).
- 계산기의 최종값은 **음수 방어**가 필요하다. 힌트 주석에 `Math.max(..., 0)` 형태로 안내돼 있다.
- 검증 실패 시 처리기가 던지는 **에러 메시지 형식**은 주석에 정확히 나와 있다. 문자열을 맞춰야 테스트가 통과한다.

---

## 셀프 체크

1. SRP의 "책임"을 "기능"이 아니라 무엇으로 판단해야 하는가?
2. `switch`로 종류를 분기하는 코드가 OCP를 어기는 이유와, 다형성으로 어떻게 고치는지 설명하라.
3. DIP의 "역전"은 무엇의 방향이 뒤집힌다는 뜻인가? 그림으로 그려보라.
4. DIP(원칙)와 DI(기법)의 관계를 한 문장으로 말해보라.
5. 협력자를 생성자로 받되 클래스 내부에서 `new`로 만들면 무엇이 깨지는가?
