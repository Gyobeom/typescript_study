// Day 5 — 종합: 작은 도메인 클래스 설계
//
// 장바구니(ShoppingCart)와 상품 라인(CartItem)을 설계하라.
// Day1~4 개념을 모두 사용한다:
//   - 클래스/생성자/메서드 (Day1)
//   - private 필드 + 메서드로만 상태 변경, readonly (Day2)
//   - 파라미터 프로퍼티 축약, getter (Day3)
//   - static 팩토리/카운터 (Day4)

// 장바구니에 담기는 한 줄. 상품명, 단가, 수량을 가진다.
export class CartItem {
  // 힌트: 파라미터 프로퍼티 축약으로 name(readonly), unitPrice(readonly), quantity 를 받는다.
  //       quantity 만 나중에 바뀔 수 있으므로 private 로 감춘다.
  constructor(
    public readonly name: string,
    public readonly unitPrice: number,
    private quantity: number,
  ) {
    // 힌트: unitPrice < 0 또는 quantity < 1 이면 Error.
    throw new Error('TODO: CartItem 검증 및 초기화');
  }

  // 현재 수량(getter)
  get qty(): number {
    // 힌트: this.quantity 반환
    throw new Error('TODO: 수량 getter');
  }

  // 수량을 delta 만큼 더한다(음수면 감소). 결과가 1 미만이 되면 Error.
  changeQuantity(delta: number): void {
    // 힌트: next = this.quantity + delta; next < 1 이면 throw; 아니면 대입.
    throw new Error('TODO: 수량 변경');
  }

  // 이 라인의 소계 = unitPrice * quantity
  get subtotal(): number {
    // 힌트: 단가 * 수량
    throw new Error('TODO: 소계 계산');
  }
}

export class ShoppingCart {
  // 힌트: 지금까지 만들어진 장바구니 수를 세는 private static 카운터.
  private static cartCount: number = 0;

  public readonly id: number;

  // 힌트: 담긴 아이템 목록. 외부에서 배열을 직접 못 바꾸도록 private 로.
  private items: CartItem[] = [];

  constructor() {
    // 힌트: cartCount++ 후 this.id 에 부여.
    throw new Error('TODO: 장바구니 생성 및 id 부여');
  }

  // 지금까지 생성된 장바구니 수(정적 메서드).
  static getCartCount(): number {
    // 힌트: ShoppingCart.cartCount 반환
    throw new Error('TODO: 장바구니 총 개수');
  }

  static resetCartCount(): void {
    // 힌트: cartCount = 0
    throw new Error('TODO: 카운터 초기화');
  }

  // 아이템을 담는다. 이미 같은 name 이 있으면 수량을 합친다(중복 방지).
  addItem(item: CartItem): void {
    // 힌트: this.items 에서 같은 name 을 찾는다.
    //       있으면 기존 라인.changeQuantity(item.qty), 없으면 items.push(item).
    throw new Error('TODO: 아이템 추가(중복 시 수량 합산)');
  }

  // 담긴 아이템 개수(라인 수, 수량 합이 아니라 서로 다른 상품 종류 수).
  get itemCount(): number {
    // 힌트: this.items.length
    throw new Error('TODO: 라인 수');
  }

  // 전체 합계 금액 = 모든 라인의 subtotal 합.
  get total(): number {
    // 힌트: reduce 로 각 라인의 subtotal 을 더한다.
    throw new Error('TODO: 합계 금액');
  }

  // 담긴 아이템들의 복사본을 반환한다(외부에서 내부 배열을 훼손하지 못하도록).
  getItems(): CartItem[] {
    // 힌트: [...this.items] 로 얕은 복사본을 반환.
    throw new Error('TODO: 아이템 목록 복사본 반환');
  }
}
