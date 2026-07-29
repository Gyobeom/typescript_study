// Day 4 테스트
import {
  NoDiscount,
  RateDiscount,
  VipDiscount,
  PriceCalculator,
  OrderValidator,
  OrderProcessor,
  DiscountPolicy,
  Order,
} from '@stage2/day4-solid';

describe('Day4: SOLID — OCP/DIP (할인 다형성)', () => {
  test('각 할인 정책은 계약대로 할인액을 계산한다', () => {
    expect(new NoDiscount().discountAmount(10000)).toBe(0);
    expect(new RateDiscount(0.1).discountAmount(10000)).toBe(1000);
    // VIP 20%지만 cap 1500에 걸린다 (floor(10000*0.2)=2000 -> min(2000,1500)=1500)
    expect(new VipDiscount(1500).discountAmount(10000)).toBe(1500);
  });

  test('PriceCalculator는 구체 할인을 몰라도 DiscountPolicy 추상에만 의존한다 (DIP)', () => {
    const policies: DiscountPolicy[] = [
      new NoDiscount(),
      new RateDiscount(0.5),
      new VipDiscount(999999),
    ];
    const finals = policies.map((p) => new PriceCalculator(p).finalPrice(10000));
    expect(finals).toEqual([10000, 5000, 8000]);
  });

  test('할인이 소계보다 커도 최종가는 0 밑으로 내려가지 않는다', () => {
    const calc = new PriceCalculator(new RateDiscount(2)); // 200% 할인 시도
    expect(calc.finalPrice(1000)).toBe(0);
  });

  test('새 할인 정책을 추가해도 PriceCalculator는 바뀌지 않는다 (OCP)', () => {
    // 테스트에서 즉석으로 만든 새 정책 — 기존 코드 수정 없이 주입만으로 동작
    const fixed: DiscountPolicy = { name: 'fixed', discountAmount: () => 300 };
    expect(new PriceCalculator(fixed).finalPrice(1000)).toBe(700);
  });
});

describe('Day4: SOLID — SRP (책임 분리)', () => {
  const validOrder: Order = { price: 1000, quantity: 3, grade: 'normal' };

  test('OrderValidator는 검증만 책임진다', () => {
    expect(new OrderValidator().validate(validOrder)).toEqual({ valid: true, errors: [] });
    const bad = new OrderValidator().validate({ price: 0, quantity: -1, grade: 'normal' });
    expect(bad.valid).toBe(false);
    expect(bad.errors).toEqual(['단가는 0보다 커야 합니다', '수량은 0보다 커야 합니다']);
  });

  test('OrderProcessor는 검증/할인을 위임하고 총액만 계산한다', () => {
    const processor = new OrderProcessor(
      new OrderValidator(),
      new PriceCalculator(new RateDiscount(0.1)),
    );
    // subtotal 3000, 10% 할인 300 => 2700
    expect(processor.process(validOrder)).toBe(2700);
  });

  test('유효하지 않은 주문은 사유와 함께 예외를 던진다', () => {
    const processor = new OrderProcessor(
      new OrderValidator(),
      new PriceCalculator(new NoDiscount()),
    );
    expect(() => processor.process({ price: 0, quantity: 5, grade: 'vip' })).toThrow(
      '유효하지 않은 주문: 단가는 0보다 커야 합니다',
    );
  });
});
