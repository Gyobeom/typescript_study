// Day 5 — 모범 답안
// Day1~4 종합: 파라미터 프로퍼티, private 캡슐화, getter, static 카운터를 한 도메인에 결합.

export class CartItem {
  constructor(
    public readonly name: string,
    public readonly unitPrice: number,
    private quantity: number,
  ) {
    if (unitPrice < 0) {
      throw new Error('단가는 음수일 수 없다');
    }
    if (quantity < 1) {
      throw new Error('수량은 1 이상이어야 한다');
    }
  }

  get qty(): number {
    return this.quantity;
  }

  changeQuantity(delta: number): void {
    const next = this.quantity + delta;
    if (next < 1) {
      throw new Error('수량은 1 미만이 될 수 없다');
    }
    this.quantity = next;
  }

  get subtotal(): number {
    return this.unitPrice * this.quantity;
  }
}

export class ShoppingCart {
  private static cartCount: number = 0;

  public readonly id: number;
  private items: CartItem[] = [];

  constructor() {
    ShoppingCart.cartCount += 1;
    this.id = ShoppingCart.cartCount;
  }

  static getCartCount(): number {
    return ShoppingCart.cartCount;
  }

  static resetCartCount(): void {
    ShoppingCart.cartCount = 0;
  }

  addItem(item: CartItem): void {
    const existing = this.items.find((i) => i.name === item.name);
    if (existing) {
      existing.changeQuantity(item.qty);
    } else {
      this.items.push(item);
    }
  }

  get itemCount(): number {
    return this.items.length;
  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + i.subtotal, 0);
  }

  getItems(): CartItem[] {
    return [...this.items];
  }
}
