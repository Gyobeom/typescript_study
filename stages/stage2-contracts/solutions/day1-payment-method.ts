// Day 1 — 모범 답안: interface와 implements

export interface PaymentResult {
  success: boolean;
  receipt: string;
}

export interface PaymentMethod {
  readonly name: string;
  pay(amount: number): PaymentResult;
}

export class CreditCardPayment implements PaymentMethod {
  readonly name: string = 'credit-card';

  pay(amount: number): PaymentResult {
    if (amount <= 0) {
      return { success: false, receipt: '결제 금액이 올바르지 않습니다' };
    }
    return { success: true, receipt: `[신용카드] ${amount}원 결제 완료` };
  }
}

export class MobilePayPayment implements PaymentMethod {
  readonly name: string = 'mobile-pay';

  pay(amount: number): PaymentResult {
    if (amount <= 0) {
      return { success: false, receipt: '결제 금액이 올바르지 않습니다' };
    }
    return { success: true, receipt: `[모바일페이] ${amount}원 결제 완료` };
  }
}

export class PointPayment implements PaymentMethod {
  readonly name: string = 'point';

  constructor(private balance: number) {}

  pay(amount: number): PaymentResult {
    if (amount <= 0) {
      return { success: false, receipt: '결제 금액이 올바르지 않습니다' };
    }
    if (amount > this.balance) {
      return {
        success: false,
        receipt: `포인트가 부족합니다 (보유 ${this.balance}, 요청 ${amount})`,
      };
    }
    this.balance -= amount;
    return { success: true, receipt: `[포인트] ${amount}원 결제 완료` };
  }

  getBalance(): number {
    return this.balance;
  }
}

export function checkout(method: PaymentMethod, amount: number): string {
  const result = method.pay(amount);
  const status = result.success ? 'OK' : 'FAIL';
  return `${status}: ${result.receipt}`;
}
