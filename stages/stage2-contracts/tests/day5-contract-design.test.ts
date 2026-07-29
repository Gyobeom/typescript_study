// Day 5 테스트
import {
  AlwaysOkGateway,
  LimitedGateway,
  InMemoryInventory,
  CollectingNotifier,
  CheckoutService,
  PaymentGateway,
  InventoryRepository,
  Notifier,
} from '@stage2/day5-contract-design';

describe('Day5: 계약 기반 설계 — 교체 가능한 구현체', () => {
  test('구현체들은 각자의 계약을 만족한다', () => {
    expect(new AlwaysOkGateway().charge(999999)).toBe(true);
    expect(new LimitedGateway(1000).charge(1000)).toBe(true);
    expect(new LimitedGateway(1000).charge(1001)).toBe(false);

    const inv = new InMemoryInventory({ apple: 5 });
    expect(inv.getStock('apple')).toBe(5);
    expect(inv.getStock('unknown')).toBe(0); // 없는 상품은 0
    inv.reduceStock('apple', 2);
    expect(inv.getStock('apple')).toBe(3);

    const noti = new CollectingNotifier();
    noti.notify('hi');
    expect(noti.getSent()).toEqual(['hi']);
  });

  test('정상 결제: 재고 차감 + 알림 발송 + 성공 반환', () => {
    const inventory = new InMemoryInventory({ apple: 10 });
    const notifier = new CollectingNotifier();
    const service = new CheckoutService(new AlwaysOkGateway(), inventory, notifier);

    const result = service.checkout({ productId: 'apple', quantity: 3, unitPrice: 1000 });
    expect(result).toEqual({ success: true, reason: '주문 완료' });
    expect(inventory.getStock('apple')).toBe(7);
    expect(notifier.getSent()).toEqual(['결제 완료: apple x3 = 3000원']);
  });

  test('재고 부족: 결제도 알림도 없이 즉시 실패', () => {
    const inventory = new InMemoryInventory({ apple: 2 });
    const notifier = new CollectingNotifier();
    const service = new CheckoutService(new AlwaysOkGateway(), inventory, notifier);

    const result = service.checkout({ productId: 'apple', quantity: 5, unitPrice: 1000 });
    expect(result).toEqual({ success: false, reason: '재고 부족' });
    expect(inventory.getStock('apple')).toBe(2); // 차감 안 됨
    expect(notifier.getSent()).toEqual([]); // 알림 없음
  });

  test('결제 실패: 재고 차감/알림 없이 실패 (한도 초과)', () => {
    const inventory = new InMemoryInventory({ apple: 10 });
    const notifier = new CollectingNotifier();
    // 한도 2000, 3개 x 1000 = 3000 => 초과
    const service = new CheckoutService(new LimitedGateway(2000), inventory, notifier);

    const result = service.checkout({ productId: 'apple', quantity: 3, unitPrice: 1000 });
    expect(result).toEqual({ success: false, reason: '결제 실패' });
    expect(inventory.getStock('apple')).toBe(10);
    expect(notifier.getSent()).toEqual([]);
  });

  test('서비스는 계약에만 의존하므로 즉석 가짜 구현으로도 동작한다 (DIP)', () => {
    const charged: number[] = [];
    const gateway: PaymentGateway = { charge: (a) => (charged.push(a), true) };
    const inventory: InventoryRepository = { getStock: () => 100, reduceStock: () => {} };
    const messages: string[] = [];
    const notifier: Notifier = { notify: (m) => messages.push(m) };

    const service = new CheckoutService(gateway, inventory, notifier);
    const result = service.checkout({ productId: 'x', quantity: 2, unitPrice: 500 });
    expect(result.success).toBe(true);
    expect(charged).toEqual([1000]);
    expect(messages).toEqual(['결제 완료: x x2 = 1000원']);
  });
});
