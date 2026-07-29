// Day 4 — 모범 답안: SOLID (SRP / OCP / DIP)

export interface Order {
  price: number;
  quantity: number;
  grade: 'normal' | 'vip';
}

export interface DiscountPolicy {
  readonly name: string;
  discountAmount(subtotal: number): number;
}

export class NoDiscount implements DiscountPolicy {
  readonly name: string = 'none';

  discountAmount(_subtotal: number): number {
    return 0;
  }
}

export class RateDiscount implements DiscountPolicy {
  readonly name: string = 'rate';

  constructor(private readonly rate: number) {}

  discountAmount(subtotal: number): number {
    return Math.floor(subtotal * this.rate);
  }
}

export class VipDiscount implements DiscountPolicy {
  readonly name: string = 'vip';

  constructor(private readonly cap: number) {}

  discountAmount(subtotal: number): number {
    const raw = Math.floor(subtotal * 0.2);
    return Math.min(raw, this.cap);
  }
}

export class PriceCalculator {
  constructor(private readonly policy: DiscountPolicy) {}

  finalPrice(subtotal: number): number {
    const discounted = subtotal - this.policy.discountAmount(subtotal);
    return Math.max(discounted, 0);
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class OrderValidator {
  validate(order: Order): ValidationResult {
    const errors: string[] = [];
    if (order.price <= 0) {
      errors.push('단가는 0보다 커야 합니다');
    }
    if (order.quantity <= 0) {
      errors.push('수량은 0보다 커야 합니다');
    }
    return { valid: errors.length === 0, errors };
  }
}

export class OrderProcessor {
  constructor(
    private readonly validator: OrderValidator,
    private readonly calculator: PriceCalculator,
  ) {}

  process(order: Order): number {
    const result = this.validator.validate(order);
    if (!result.valid) {
      throw new Error(`유효하지 않은 주문: ${result.errors.join(', ')}`);
    }
    const subtotal = order.price * order.quantity;
    return this.calculator.finalPrice(subtotal);
  }
}
