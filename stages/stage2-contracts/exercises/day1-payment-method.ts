// Day 1 — interface와 implements: 계약으로서의 인터페이스
//
// [계약] 아래 PaymentMethod 인터페이스는 "결제 수단이라면 반드시 이런 모양이어야 한다"는
// 계약이다. 이 계약 정의는 이미 제공된다. 여러분의 일은 이 하나의 계약을
// 서로 다른 여러 클래스로 "구현(implements)"하는 것이다.
//
// 핵심: 사용하는 쪽(아래 checkout 함수)은 구체 클래스가 아니라 PaymentMethod라는
// "추상"에만 의존한다. 그래서 결제 수단을 얼마든지 추가·교체해도 checkout은 바뀌지 않는다.

/** 결제 결과 — 성공 여부와 사람이 읽을 수 있는 영수증 메시지 */
export interface PaymentResult {
  success: boolean;
  receipt: string;
}

/** [계약] 모든 결제 수단이 지켜야 할 인터페이스 (수정 금지, 구현 대상) */
export interface PaymentMethod {
  /** 결제 수단의 이름 (예: 'credit-card') */
  readonly name: string;
  /** 주어진 금액(원)을 결제하고 결과를 돌려준다 */
  pay(amount: number): PaymentResult;
}

/**
 * 신용카드 결제.
 * name === 'credit-card'
 * 성공 시 receipt: `[신용카드] {amount}원 결제 완료`
 */
export class CreditCardPayment implements PaymentMethod {
  // 힌트: readonly 프로퍼티 name을 'credit-card'로 초기화하라.
  readonly name: string = 'credit-card';

  pay(amount: number): PaymentResult {
    // 힌트: amount가 0 이하이면 success:false, receipt:'결제 금액이 올바르지 않습니다'.
    //       그 외에는 success:true, receipt:`[신용카드] ${amount}원 결제 완료`.
    if (amount <= 0)
      return { success: false, receipt: '결제 금액이 올바르지 않습니다' }
    return { success: true, receipt: `[신용카드] ${amount}원 결제 완료` }
  }
}

/**
 * 모바일페이 결제.
 * name === 'mobile-pay'
 * 성공 시 receipt: `[모바일페이] {amount}원 결제 완료`
 */
export class MobilePayPayment implements PaymentMethod {
  // 힌트: name을 'mobile-pay'로.
  readonly name: string = 'mobile-pay';

  pay(amount: number): PaymentResult {
    // 힌트: CreditCardPayment와 같은 검증 규칙, receipt 접두사만 [모바일페이]로.
    if (amount <= 0)
      return { success: false, receipt: '결제 금액이 올바르지 않습니다' }
    return { success: true, receipt: `[모바일페이] ${amount}원 결제 완료` }
  }
}

/**
 * 포인트 결제 — 보유 포인트 한도가 있다.
 * name === 'point'
 * 생성자에서 보유 포인트를 받는다.
 * 잔액보다 큰 금액을 결제하려 하면 실패.
 */
export class PointPayment implements PaymentMethod {
  readonly name: string = 'point';

  // 힌트: 파라미터 프로퍼티 축약으로 balance를 받아라. (stage1에서 배운 그 문법)
  constructor(private balance: number) { }

  pay(amount: number): PaymentResult {
    if (amount <= 0)
      return { success: false, receipt: '결제 금액이 올바르지 않습니다' }
    else if (amount > this.balance)
      return { success: false, receipt: `포인트가 부족합니다 (보유 ${this.balance}, 요청 ${amount})` }
    this.balance -= amount;
    return {
      success: true, receipt: `[포인트] ${amount}원 결제 완료`
    }
    // 힌트:
    // - amount가 0 이하이면 실패, receipt:'결제 금액이 올바르지 않습니다'.
    // - amount가 balance보다 크면 실패, receipt:`포인트가 부족합니다 (보유 ${balance}, 요청 ${amount})`.
    // - 그 외에는 balance를 amount만큼 차감하고 성공, receipt:`[포인트] ${amount}원 결제 완료`.
  }

  /** 남은 포인트 잔액 (테스트에서 차감을 확인한다) */
  getBalance(): number {
    return this.balance
    // 힌트: 현재 balance를 반환.
  }
}

/**
 * [계약에 의존하는 사용처]
 * checkout은 구체 결제 수단을 전혀 모른다. 오직 PaymentMethod 계약에만 의존한다.
 * 이 함수는 이미 완성되어 있다 — 구현할 필요 없다. 다형성이 어떻게 쓰이는지 보라.
 */
export function checkout(method: PaymentMethod, amount: number): string {
  const result = method.pay(amount);
  const status = result.success ? 'OK' : 'FAIL';
  return `${status}: ${result.receipt}`;
}
