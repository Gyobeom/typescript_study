// Day 4 — SOLID 입문 (SRP / OCP / DIP)
//
// 이 파일은 "원칙 위반 코드를 고치는" 문제다. 두 갈래로 나뉜다.
//
// [A] OCP + DIP: switch 분기를 다형성으로.
//   할인 종류가 늘 때마다 switch에 case를 추가하는 코드는 "확장에 열려있지 않고
//   수정에 열려있다" — OCP 위반이다. 각 할인을 DiscountPolicy 계약의 구현체로 만들면,
//   새 할인은 "새 클래스 추가"로 끝나고 기존 코드는 건드리지 않는다.
//   그리고 계산기(PriceCalculator)는 구체 할인이 아니라 DiscountPolicy '추상'에
//   의존한다 — 이게 DIP(의존 역전)다.
//
// [B] SRP: 한 클래스가 너무 많은 책임을 지지 않게 쪼갠다.
//   OrderProcessor는 "주문 총액 계산"만 책임진다. 유효성 검증은 OrderValidator가,
//   할인은 DiscountPolicy가 맡는다. 각 클래스가 "바뀌는 이유"를 하나만 갖게 한다.

export interface Order {
  /** 상품 단가 */
  price: number;
  /** 수량 */
  quantity: number;
  /** 고객 등급 */
  grade: 'normal' | 'vip';
}

// ─────────────────────────────────────────────────────────────
// [A] OCP + DIP — 할인 정책을 계약으로
// ─────────────────────────────────────────────────────────────

/** [계약] 할인 정책. 소계(subtotal)를 받아 "할인액"을 돌려준다 */
export interface DiscountPolicy {
  /** 이 정책의 이름 (예: 'none', 'rate', 'vip') */
  readonly name: string;
  /** subtotal에 대해 깎아줄 금액을 계산한다 (0 이상) */
  discountAmount(subtotal: number): number;
}

/** 할인 없음: 항상 0원 할인 */
export class NoDiscount implements DiscountPolicy {
  readonly name: string = 'none';

  discountAmount(subtotal: number): number {
    return 0
  }
}

/** 정률 할인: subtotal의 rate(0~1) 비율만큼 할인. 결과는 내림(Math.floor). */
export class RateDiscount implements DiscountPolicy {
  readonly name: string = 'rate';

  // 힌트: 파라미터 프로퍼티로 rate를 받아라 (예: 0.1 => 10% 할인).
  constructor(private readonly rate: number) { }

  discountAmount(subtotal: number): number {
    // 힌트: Math.floor(subtotal * this.rate) 반환.
    return Math.floor(subtotal * this.rate)
  }
}

/**
 * VIP 할인: 20% 할인하되, 할인액 상한(cap)이 있다.
 * 즉 min(floor(subtotal*0.2), cap).
 */
export class VipDiscount implements DiscountPolicy {
  readonly name: string = 'vip';

  // 힌트: 상한 cap을 파라미터 프로퍼티로 받아라.
  constructor(private readonly cap: number) { }

  discountAmount(subtotal: number): number {
    // 힌트: raw = Math.floor(subtotal * 0.2); return Math.min(raw, this.cap);
    const cost = Math.floor(subtotal * 0.2)
    return Math.min(cost, this.cap)
  }
}

/**
 * 가격 계산기 — 구체 할인이 아니라 DiscountPolicy '추상'에 의존한다(DIP).
 * 새 할인 정책이 생겨도 이 클래스는 절대 바뀌지 않는다(OCP).
 */
export class PriceCalculator {
  // 힌트: DiscountPolicy를 주입받아라 (구체 타입 금지, 인터페이스로).
  constructor(private readonly policy: DiscountPolicy) { }

  /** 최종 결제액 = subtotal - 할인액. 음수면 0으로 막는다. */
  finalPrice(subtotal: number): number {
    const final_cost = subtotal - this.policy.discountAmount(subtotal);
    if (final_cost < 0)
      return 0
    else
      return final_cost
  }
}

// ─────────────────────────────────────────────────────────────
// [B] SRP — 검증 책임 분리
// ─────────────────────────────────────────────────────────────

/** 검증 결과: 통과 여부와 사유 목록 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 주문 유효성 검증만 책임진다 (SRP).
 * 규칙:
 *   - price가 0 이하이면 errors에 '단가는 0보다 커야 합니다'
 *   - quantity가 0 이하이면 errors에 '수량은 0보다 커야 합니다'
 * errors가 비어 있으면 valid:true.
 */
export class OrderValidator {
  validate(order: Order): ValidationResult {
    // 힌트: errors 배열을 만들고 두 규칙을 검사한 뒤,
    //       { valid: errors.length === 0, errors } 반환.
    const errors = [];
    if (order.price <= 0)
      errors.push('단가는 0보다 커야 합니다')
    if (order.quantity <= 0)
      errors.push('수량은 0보다 커야 합니다')

    return { valid: errors.length === 0, errors: errors }
  }
}

/**
 * 주문 처리 — "총액 계산"만 책임진다 (SRP).
 * 검증은 OrderValidator에, 할인은 PriceCalculator/DiscountPolicy에 위임한다.
 *
 * process(order):
 *   1) validator.validate(order)가 invalid면 Error를 던진다:
 *      throw new Error(`유효하지 않은 주문: ${errors.join(', ')}`)
 *   2) subtotal = price * quantity
 *   3) calculator.finalPrice(subtotal) 반환
 */
export class OrderProcessor {
  // 힌트: OrderValidator와 PriceCalculator를 둘 다 주입받아라 (조합 + DIP).
  constructor(
    private readonly validator: OrderValidator,
    private readonly calculator: PriceCalculator,
  ) { }

  process(order: Order): number {
    // 힌트: 위 1~3 순서대로 구현하라.
    const validation = this.validator.validate(order);
    if (validation.valid === false)
      throw new Error(`유효하지 않은 주문: ${validation.errors.join(', ')}`)
    const subtotal = order.price * order.quantity;
    const total = this.calculator.finalPrice(subtotal);
    return total
  }
}
