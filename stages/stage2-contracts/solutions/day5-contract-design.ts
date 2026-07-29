// Day 5 — 모범 답안: 계약 기반 설계

export interface PaymentGateway {
  charge(amount: number): boolean;
}

export interface InventoryRepository {
  getStock(productId: string): number;
  reduceStock(productId: string, qty: number): void;
}

export interface Notifier {
  notify(message: string): void;
}

export interface CheckoutRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CheckoutResult {
  success: boolean;
  reason: string;
}

export class AlwaysOkGateway implements PaymentGateway {
  charge(_amount: number): boolean {
    return true;
  }
}

export class LimitedGateway implements PaymentGateway {
  constructor(private readonly limit: number) {}

  charge(amount: number): boolean {
    return amount <= this.limit;
  }
}

export class InMemoryInventory implements InventoryRepository {
  constructor(private readonly stock: Record<string, number>) {}

  getStock(productId: string): number {
    return this.stock[productId] ?? 0;
  }

  reduceStock(productId: string, qty: number): void {
    this.stock[productId] = this.getStock(productId) - qty;
  }
}

export class CollectingNotifier implements Notifier {
  private sent: string[] = [];

  notify(message: string): void {
    this.sent.push(message);
  }

  getSent(): string[] {
    return [...this.sent];
  }
}

export class CheckoutService {
  constructor(
    private readonly gateway: PaymentGateway,
    private readonly inventory: InventoryRepository,
    private readonly notifier: Notifier,
  ) {}

  checkout(req: CheckoutRequest): CheckoutResult {
    if (this.inventory.getStock(req.productId) < req.quantity) {
      return { success: false, reason: '재고 부족' };
    }

    const amount = req.unitPrice * req.quantity;
    if (!this.gateway.charge(amount)) {
      return { success: false, reason: '결제 실패' };
    }

    this.inventory.reduceStock(req.productId, req.quantity);
    this.notifier.notify(`결제 완료: ${req.productId} x${req.quantity} = ${amount}원`);
    return { success: true, reason: '주문 완료' };
  }
}
