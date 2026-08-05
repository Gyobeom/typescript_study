// 복습(인출 연습) — 스테이지 1 종합
//
// 이 문제에는 구현 힌트가 없다. 요구사항 명세만 읽고, 그 주에 배운
// 클래스 개념을 스스로 꺼내 써서 도서관 대출 도메인을 완성하라.
//
// 도메인: 도서(Book)와 책장(Bookshelf).
//   책장은 여러 종류의 도서를 보관하고, 대출/반납으로 재고를 관리한다.

// ── Book ─────────────────────────────────────────────────────────────
// 한 종류의 도서. 서로 다른 재고(복본) 수를 가진다.
//
// 생성:
//   - isbn(문자열, 생성 후 변경 불가), title(문자열, 생성 후 변경 불가),
//     totalCopies(전체 보유 복본 수)를 받아 생성한다.
//   - 검증 후 거부: isbn 이 빈 문자열이면 Error. totalCopies 가 1 미만이면 Error.
//   - 생성 직후에는 모든 복본이 대출 가능 상태다(대출된 복본 0).
//
// 외부에서 관찰 가능한 값:
//   - isbn, title 은 읽을 수 있어야 하되 재할당은 불가능해야 한다.
//   - total: 전체 보유 복본 수.
//   - borrowed: 현재 대출 중인 복본 수. 외부에서 이 값을 직접 대입하는 것은 불가능해야 한다.
//   - available: 현재 대출 가능한 복본 수(= total - borrowed).
//
// 동작:
//   - lend(): 복본 1권을 대출 처리한다. 대출 가능한 복본이 없으면 Error.
//   - giveBack(): 복본 1권을 반납 처리한다. 대출 중인 복본이 없으면 Error.
export class Book {
  public readonly isbn!: string;
  public readonly title!: string;

  constructor(isbn: string, title: string, totalCopies: number) {
    throw new Error('TODO');
  }

  get total(): number {
    throw new Error('TODO');
  }

  get borrowed(): number {
    throw new Error('TODO');
  }

  get available(): number {
    throw new Error('TODO');
  }

  lend(): void {
    throw new Error('TODO');
  }

  giveBack(): void {
    throw new Error('TODO');
  }
}

// ── Bookshelf ────────────────────────────────────────────────────────
// 도서들을 보관하는 책장. 여러 개 만들어질 수 있고, 각자 고유 번호를 가진다.
//
// 식별 번호:
//   - 만들어진 순서대로 1부터 증가하는 고유 id 를 부여받는다(읽기 전용).
//   - 지금까지 만들어진 책장의 총 개수를 클래스 레벨에서 알 수 있어야 한다.
//   - 테스트 격리를 위해 그 총 개수를 0 으로 되돌릴 수 있어야 한다.
//
// 생성:
//   - 일반 생성으로 빈 책장을 만들 수 있다.
//   - 정적 팩토리로 여러 도서를 한 번에 담아 책장을 만들 수 있어야 한다.
//
// 보관:
//   - add(book): 도서를 책장에 넣는다. 이미 같은 isbn 의 도서가 있으면 Error(중복 등록 금지).
//   - titleCount: 보관 중인 도서 "종류" 수.
//   - findByIsbn(isbn): 해당 isbn 의 도서를 반환한다. 없으면 undefined.
//   - list(): 보관 중인 도서 목록을 반환하되, 반환값을 밖에서 훼손해도
//     책장 내부 목록은 영향받지 않아야 한다.
//   - totalAvailable: 책장 전체에서 현재 대출 가능한 복본의 총합.
export class Bookshelf {
  constructor() {
    throw new Error('TODO');
  }

  static createWith(books: Book[]): Bookshelf {
    throw new Error('TODO');
  }

  static getShelfCount(): number {
    throw new Error('TODO');
  }

  static resetShelfCount(): void {
    throw new Error('TODO');
  }

  public readonly id!: number;

  add(book: Book): void {
    throw new Error('TODO');
  }

  get titleCount(): number {
    throw new Error('TODO');
  }

  findByIsbn(isbn: string): Book | undefined {
    throw new Error('TODO');
  }

  list(): Book[] {
    throw new Error('TODO');
  }

  get totalAvailable(): number {
    throw new Error('TODO');
  }
}
