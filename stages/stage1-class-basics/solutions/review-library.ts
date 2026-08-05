// 복습(인출 연습) — 스테이지 1 종합 · 풀이
//
// 도메인: 도서(Book)와 책장(Bookshelf).

export class Book {
  public readonly isbn: string;
  public readonly title: string;
  private borrowedCopies = 0;

  constructor(
    isbn: string,
    title: string,
    private readonly totalCopies: number, // 파라미터 프로퍼티 축약
  ) {
    if (isbn === '') throw new Error('isbn 은 빈 문자열일 수 없습니다.');
    if (totalCopies < 1) throw new Error('totalCopies 는 1 이상이어야 합니다.');
    this.isbn = isbn;
    this.title = title;
  }

  get total(): number {
    return this.totalCopies;
  }

  get borrowed(): number {
    return this.borrowedCopies;
  }

  get available(): number {
    return this.totalCopies - this.borrowedCopies;
  }

  lend(): void {
    if (this.available < 1) throw new Error('대출 가능한 복본이 없습니다.');
    this.borrowedCopies++;
  }

  giveBack(): void {
    if (this.borrowedCopies < 1) throw new Error('대출 중인 복본이 없습니다.');
    this.borrowedCopies--;
  }
}

export class Bookshelf {
  private static shelfCount = 0;

  public readonly id: number;

  private books: Book[] = [];

  constructor() {
    Bookshelf.shelfCount++;
    this.id = Bookshelf.shelfCount;
  }

  static createWith(books: Book[]): Bookshelf {
    const shelf = new Bookshelf();
    for (const book of books) {
      shelf.add(book);
    }
    return shelf;
  }

  static getShelfCount(): number {
    return Bookshelf.shelfCount;
  }

  static resetShelfCount(): void {
    Bookshelf.shelfCount = 0;
  }

  add(book: Book): void {
    if (this.findByIsbn(book.isbn)) {
      throw new Error(`이미 등록된 도서입니다: ${book.isbn}`);
    }
    this.books.push(book);
  }

  get titleCount(): number {
    return this.books.length;
  }

  findByIsbn(isbn: string): Book | undefined {
    return this.books.find((book) => book.isbn === isbn);
  }

  list(): Book[] {
    return [...this.books];
  }

  get totalAvailable(): number {
    return this.books.reduce((sum, book) => sum + book.available, 0);
  }
}
