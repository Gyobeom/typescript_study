// Day 5 — 종합: 계약 기반 설계
//
// 이번 주에 배운 걸 한 자리에 모은다. 하나의 서비스(CheckoutService)가 세 개의
// 계약(인터페이스)에만 의존하고, 실제 구현체는 생성자로 주입받는다.
//
//   PaymentGateway     — 결제 처리       (Day1 다형성)
//   InventoryRepository — 재고 조회/차감   (Day3 조합/주입)
//   Notifier           — 알림 발송        (교체 가능한 구현체)
//
// CheckoutService는 "구현이 아니라 추상에 의존"한다. 이것이 NestJS 전체의 구조이자
// DIP의 실전 형태다. 테스트에서는 각 계약의 가짜(fake) 구현을 꽂아 서비스를 검증한다.
//
// 계약 세 개는 이미 제공된다. 여러분은:
//   (1) 인메모리 구현체 몇 개와
//   (2) 세 계약에만 의존하는 CheckoutService.checkout 을 완성한다.

// ── 계약들 (수정 금지) ────────────────────────────────────────
export interface PaymentGateway {
  /** amount 결제 시도 → 성공 여부 */
  charge(amount: number): boolean;
}

export interface InventoryRepository {
  /** productId의 현재 재고 수량 */
  getStock(productId: string): number;
  /** productId 재고를 qty만큼 줄인다 */
  reduceStock(productId: string, qty: number): void;
}

export interface Notifier {
  /** 사용자에게 메시지를 보낸다 */
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

// ── 교체 가능한 구현체들 ──────────────────────────────────────

/**
 * 항상 성공하는 결제 게이트웨이 (테스트/데모용 구현체).
 * charge는 언제나 true.
 */
export class AlwaysOkGateway implements PaymentGateway {
  charge(amount: number): boolean {
    // 힌트: 언제나 true 반환. (amount는 이 구현에선 쓰지 않아도 된다)
    throw new Error('TODO: AlwaysOkGateway.charge 를 구현하라');
  }
}

/**
 * 한도 초과 시 실패하는 결제 게이트웨이.
 * 생성자에서 한도 limit을 받고, amount가 limit을 넘으면 false.
 */
export class LimitedGateway implements PaymentGateway {
  // 힌트: limit을 파라미터 프로퍼티로 받아라.
  constructor(private readonly limit: number) {}

  charge(amount: number): boolean {
    // 힌트: amount <= this.limit 이면 true, 아니면 false.
    throw new Error('TODO: LimitedGateway.charge 를 구현하라');
  }
}

/**
 * 인메모리 재고 저장소.
 * 생성자에서 초기 재고 맵을 받는다 (예: { apple: 10 }).
 * 없는 productId의 재고는 0으로 취급한다.
 */
export class InMemoryInventory implements InventoryRepository {
  // 힌트: 주입받은 초기값을 내부 Map/객체에 보관하라.
  constructor(private readonly stock: Record<string, number>) {}

  getStock(productId: string): number {
    // 힌트: this.stock[productId]가 없으면 0을 반환 (?? 사용).
    throw new Error('TODO: InMemoryInventory.getStock 를 구현하라');
  }

  reduceStock(productId: string, qty: number): void {
    // 힌트: 현재 재고에서 qty를 빼서 다시 저장하라 (getStock 재사용 가능).
    throw new Error('TODO: InMemoryInventory.reduceStock 를 구현하라');
  }
}

/**
 * 보낸 알림을 배열에 모아두는 Notifier (테스트에서 확인용).
 */
export class CollectingNotifier implements Notifier {
  // 힌트: 보낸 메시지를 담을 private 배열을 두어라.
  private sent: string[] = [];

  notify(message: string): void {
    // 힌트: 배열에 push.
    throw new Error('TODO: CollectingNotifier.notify 를 구현하라');
  }

  /** 지금까지 보낸 메시지 목록 (복사본) */
  getSent(): string[] {
    // 힌트: [...sent] 반환.
    throw new Error('TODO: CollectingNotifier.getSent 를 구현하라');
  }
}

// ── 계약에만 의존하는 서비스 ──────────────────────────────────

/**
 * 결제 서비스 — 세 계약에만 의존한다. 구체 클래스는 전혀 모른다(DIP).
 *
 * checkout(req) 순서:
 *   1) 재고 확인: inventory.getStock(productId) < quantity 이면
 *      실패 반환 { success:false, reason:'재고 부족' } (결제/알림 없음)
 *   2) 결제: amount = unitPrice * quantity.
 *      gateway.charge(amount)가 false면
 *      실패 반환 { success:false, reason:'결제 실패' } (재고 차감/알림 없음)
 *   3) 성공: inventory.reduceStock(productId, quantity) 하고,
 *      notifier.notify(`결제 완료: ${productId} x${quantity} = ${amount}원`) 호출,
 *      { success:true, reason:'주문 완료' } 반환.
 */
export class CheckoutService {
  // 힌트: 세 계약을 모두 인터페이스 타입으로 주입받아라 (구체 클래스 금지).
  constructor(
    private readonly gateway: PaymentGateway,
    private readonly inventory: InventoryRepository,
    private readonly notifier: Notifier,
  ) {}

  checkout(req: CheckoutRequest): CheckoutResult {
    // 힌트: 위 주석의 1→2→3 순서를 그대로 코드로 옮겨라.
    //       각 단계의 "이후 동작 없음"(early return)을 지키는 게 핵심이다.
    throw new Error('TODO: CheckoutService.checkout 를 구현하라');
  }
}
