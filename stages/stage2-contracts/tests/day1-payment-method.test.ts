// Day 1 테스트 — @stage2 경로로 import (TARGET에 따라 exercises/solutions를 대상으로 실행)
import {
  CreditCardPayment,
  MobilePayPayment,
  PointPayment,
  PaymentMethod,
  checkout,
} from '@stage2/day1-payment-method';

describe('Day1: PaymentMethod 인터페이스와 다형적 구현', () => {
  test('CreditCardPayment는 계약을 지키고 성공 영수증을 만든다', () => {
    const card = new CreditCardPayment();
    expect(card.name).toBe('credit-card');
    const result = card.pay(10000);
    expect(result.success).toBe(true);
    expect(result.receipt).toBe('[신용카드] 10000원 결제 완료');
  });

  test('MobilePayPayment는 이름과 접두사가 다르지만 같은 계약을 만족한다', () => {
    const example = new MobilePayPayment();
    expect(example.name).toBe('mobile-pay');
    expect(example.pay(5000).receipt).toBe('[모바일페이] 5000원 결제 완료');
  });

  test('금액이 0 이하이면 어떤 결제 수단도 실패한다', () => {
    expect(new CreditCardPayment().pay(0).success).toBe(false);
    expect(new MobilePayPayment().pay(-100).success).toBe(false);
    expect(new CreditCardPayment().pay(-1).receipt).toBe('결제 금액이 올바르지 않습니다');
  });

  test('PointPayment는 잔액을 차감하고, 부족하면 실패한다', () => {
    const point = new PointPayment(3000);
    const ok = point.pay(1000);
    expect(ok.success).toBe(true);
    expect(point.getBalance()).toBe(2000);

    const fail = point.pay(9999);
    expect(fail.success).toBe(false);
    expect(fail.receipt).toBe('포인트가 부족합니다 (보유 2000, 요청 9999)');
    // 실패 시 잔액은 그대로여야 한다
    expect(point.getBalance()).toBe(2000);
  });

  test('checkout은 구체 클래스를 몰라도 PaymentMethod 계약만으로 동작한다 (다형성)', () => {
    const methods: PaymentMethod[] = [
      new CreditCardPayment(),
      new MobilePayPayment(),
      new PointPayment(10000),
    ];
    const lines = methods.map((m) => checkout(m, 1000));
    expect(lines[0]).toBe('OK: [신용카드] 1000원 결제 완료');
    expect(lines[1]).toBe('OK: [모바일페이] 1000원 결제 완료');
    expect(lines[2]).toBe('OK: [포인트] 1000원 결제 완료');
  });
});
