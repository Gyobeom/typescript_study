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
    if (unitPrice < 0 || quantity < 1)
      throw new Error('잘못된 값 입력')
  }

  // 현재 수량(getter)
  get qty(): number {
    return this.quantity
  }

  // 수량을 delta 만큼 더한다(음수면 감소). 결과가 1 미만이 되면 Error.
  changeQuantity(delta: number): void {
    const result = this.quantity + delta
    if (result < 1)
      throw new Error("수량은 마이너스가 될 수 없습니다.")
    this.quantity = result
  }

  // 이 라인의 소계 = unitPrice * quantity
  get subtotal(): number {
    return this.unitPrice * this.quantity
  }
}

export class ShoppingCart {
  // 힌트: 지금까지 만들어진 장바구니 수를 세는 private static 카운터.
  private static cartCount: number = 0;

  public readonly id: number;

  // 힌트: 담긴 아이템 목록. 외부에서 배열을 직접 못 바꾸도록 private 로.
  private items: CartItem[] = [];

  constructor() {
    ShoppingCart.cartCount++;
    this.id = ShoppingCart.cartCount;
  }

  // 지금까지 생성된 장바구니 수(정적 메서드).
  static getCartCount(): number {
    // 힌트: ShoppingCart.cartCount 반환
    return ShoppingCart.cartCount
  }

  static resetCartCount(): void {
    // 힌트: cartCount = 0
    ShoppingCart.cartCount = 0
  }

  // 아이템을 담는다. 이미 같은 name 이 있으면 수량을 합친다(중복 방지).
  addItem(item: CartItem): void {
    // 힌트: this.items 에서 같은 name 을 찾는다.
    //       있으면 기존 라인.changeQuantity(item.qty), 없으면 items.push(item).
    const targetItem = this.items.find(item_info => item_info.name == item.name)
    if (targetItem)
      targetItem.changeQuantity(item.qty)
    else
      this.items.push(item)
  }

  // 담긴 아이템 개수(라인 수, 수량 합이 아니라 서로 다른 상품 종류 수).
  get itemCount(): number {
    // 힌트: this.items.length
    return this.items.length
  }

  // 전체 합계 금액 = 모든 라인의 subtotal 합.
  get total(): number {
    return this.items.reduce((sum, cur) => sum + cur.subtotal, 0)
  }

  // 담긴 아이템들의 복사본을 반환한다(외부에서 내부 배열을 훼손하지 못하도록).
  getItems(): CartItem[] {
    return [...this.items]
  }
}
