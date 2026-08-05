import { Book, Bookshelf } from '@stage1/review-library';

describe('복습 · Book', () => {
  it('생성 직후에는 전체 복본이 모두 대출 가능하다', () => {
    const book = new Book('978-1', 'Clean Code', 3);
    expect(book.total).toBe(3);
    expect(book.borrowed).toBe(0);
    expect(book.available).toBe(3);
  });

  it('빈 isbn 이나 1 미만 복본은 거부하되 유효한 값은 허용한다', () => {
    expect(new Book('978-1', 'ok', 1).available).toBe(1);
    expect(() => new Book('', 'no isbn', 1)).toThrow();
    expect(() => new Book('978-2', '재고 없음', 0)).toThrow();
  });

  it('lend 하면 대출 수가 늘고 대출 가능 수가 준다', () => {
    const book = new Book('978-1', 'Clean Code', 2);
    book.lend();
    expect(book.borrowed).toBe(1);
    expect(book.available).toBe(1);
  });

  it('대출 가능한 복본이 없으면 lend 는 거부한다', () => {
    const book = new Book('978-1', 'Clean Code', 1);
    book.lend();
    expect(() => book.lend()).toThrow();
    expect(book.borrowed).toBe(1);
  });

  it('giveBack 은 대출 수를 되돌리고, 대출이 없으면 거부한다', () => {
    const book = new Book('978-1', 'Clean Code', 1);
    expect(() => book.giveBack()).toThrow(); // 아무도 안 빌린 상태
    book.lend();
    book.giveBack();
    expect(book.available).toBe(1);
  });

  it('isbn 은 readonly 라 재할당하면 컴파일 에러다(타입 레벨)', () => {
    const book = new Book('978-1', 'Clean Code', 1);
    // 이 줄에 타입 에러가 나야만 테스트가 컴파일된다(readonly 검증).
    // (readonly 는 컴파일 타임 보장이라 런타임 대입 자체는 막지 못한다.)
    // @ts-expect-error isbn 은 readonly 라 재할당 불가
    book.isbn = '978-9';
    expect(book.isbn).toBe('978-9');
  });
});

describe('복습 · Bookshelf', () => {
  beforeEach(() => {
    Bookshelf.resetShelfCount();
  });

  it('책장마다 id 가 1부터 증가하고 총 개수를 센다', () => {
    const s1 = new Bookshelf();
    const s2 = new Bookshelf();
    expect(s1.id).toBe(1);
    expect(s2.id).toBe(2);
    expect(Bookshelf.getShelfCount()).toBe(2);
  });

  it('정적 팩토리 createWith 로 여러 도서를 담아 만든다', () => {
    const shelf = Bookshelf.createWith([
      new Book('978-1', 'A', 2),
      new Book('978-2', 'B', 3),
    ]);
    expect(shelf.titleCount).toBe(2);
    expect(shelf.totalAvailable).toBe(5);
  });

  it('같은 isbn 을 중복 등록하면 거부한다', () => {
    const shelf = new Bookshelf();
    shelf.add(new Book('978-1', 'A', 1));
    expect(() => shelf.add(new Book('978-1', 'A 재판', 1))).toThrow();
    expect(shelf.titleCount).toBe(1);
  });

  it('findByIsbn 은 도서를 찾고, 없으면 undefined 를 준다', () => {
    const shelf = new Bookshelf();
    shelf.add(new Book('978-1', 'A', 1));
    expect(shelf.findByIsbn('978-1')?.title).toBe('A');
    expect(shelf.findByIsbn('없음')).toBeUndefined();
  });

  it('대출/반납이 책장 전체 대출 가능 수에 반영된다', () => {
    const shelf = Bookshelf.createWith([
      new Book('978-1', 'A', 2),
      new Book('978-2', 'B', 1),
    ]);
    shelf.findByIsbn('978-1')!.lend();
    expect(shelf.totalAvailable).toBe(2); // 3 - 1
  });

  it('list 는 복사본이라 반환값을 훼손해도 내부는 보호된다', () => {
    const shelf = new Bookshelf();
    shelf.add(new Book('978-1', 'A', 1));
    const books = shelf.list();
    books.pop();
    expect(shelf.titleCount).toBe(1);
  });
});
