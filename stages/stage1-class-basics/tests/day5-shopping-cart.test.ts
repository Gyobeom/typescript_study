import { CartItem, ShoppingCart } from '@stage1/day5-shopping-cart';

describe('Day 5 — CartItem', () => {
  it('생성 후 소계는 단가 * 수량이다', () => {
    const item = new CartItem('사과', 1000, 3);
    expect(item.qty).toBe(3);
    expect(item.subtotal).toBe(3000);
  });

  it('수량 1 미만 생성은 거부하되 1 이상은 허용한다', () => {
    // 유효 수량은 성공해야 하고(무조건 throw 하는 스켈레톤은 여기서 실패)
    expect(new CartItem('사과', 1000, 1).qty).toBe(1);
    expect(() => new CartItem('사과', 1000, 0)).toThrow();
  });

  it('음수 단가 생성은 거부하되 0 이상은 허용한다', () => {
    expect(new CartItem('사과', 0, 1).unitPrice).toBe(0);
    expect(() => new CartItem('사과', -1, 1)).toThrow();
  });

  it('changeQuantity 로 수량을 조절한다', () => {
    const item = new CartItem('사과', 1000, 3);
    item.changeQuantity(2);
    expect(item.qty).toBe(5);
    item.changeQuantity(-4);
    expect(item.qty).toBe(1);
  });

  it('수량이 1 미만이 되는 변경은 거부한다', () => {
    const item = new CartItem('사과', 1000, 1);
    expect(() => item.changeQuantity(-1)).toThrow();
    expect(item.qty).toBe(1);
  });
});

describe('Day 5 — ShoppingCart', () => {
  beforeEach(() => {
    ShoppingCart.resetCartCount();
  });

  it('장바구니마다 id 가 1부터 증가한다', () => {
    const c1 = new ShoppingCart();
    const c2 = new ShoppingCart();
    expect(c1.id).toBe(1);
    expect(c2.id).toBe(2);
    expect(ShoppingCart.getCartCount()).toBe(2);
  });

  it('아이템을 담으면 라인 수와 합계가 반영된다', () => {
    const cart = new ShoppingCart();
    cart.addItem(new CartItem('사과', 1000, 2));
    cart.addItem(new CartItem('바나나', 500, 3));
    expect(cart.itemCount).toBe(2);
    expect(cart.total).toBe(2000 + 1500);
  });

  it('같은 상품을 다시 담으면 수량이 합산된다(라인 수는 그대로)', () => {
    const cart = new ShoppingCart();
    cart.addItem(new CartItem('사과', 1000, 2));
    cart.addItem(new CartItem('사과', 1000, 3));
    expect(cart.itemCount).toBe(1);
    expect(cart.total).toBe(5000);
  });

  it('getItems 는 복사본을 반환해 내부 배열을 보호한다', () => {
    const cart = new ShoppingCart();
    cart.addItem(new CartItem('사과', 1000, 1));
    const items = cart.getItems();
    items.pop(); // 반환된 배열을 훼손해도
    expect(cart.itemCount).toBe(1); // 내부는 그대로여야 한다
  });

  it('items 는 private 이라 외부 직접 접근 불가', () => {
    const cart = new ShoppingCart();
    // @ts-expect-error items 는 private
    void cart.items;
    expect(cart.itemCount).toBe(0);
  });
});
