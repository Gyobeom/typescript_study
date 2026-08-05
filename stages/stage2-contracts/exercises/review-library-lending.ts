// 복습(인출 연습) — 도서관 대출 시스템
//
// 이번 주(Day1~5)에 배운 계약 설계의 모든 조각을 힌트 없이 스스로 꺼내 쓴다.
// 구현 힌트는 없다. 아래 "요구사항 명세"만 읽고 계약의 의미와 동작 규칙을 코드로 옮긴다.
//
// 커버하는 개념:
//   (1) 다형성   — 하나의 계약(LateFeePolicy)을 여러 클래스가 다르게 구현하고,
//                  계약만 아는 함수가 어떤 구현이 와도 동작한다.
//   (2) 추상 클래스 + 템플릿 메서드
//                — MembershipCard가 공통 뼈대(describe)를 고정하고,
//                  달라지는 조각(maxLoans / loanPeriodDays)만 자식이 채운다.
//   (3) 조합/위임 — LendingService가 협력자들을 "생성자로 주입받아" 위임한다(has-a).
//   (4) DIP      — 서비스가 구체가 아니라 계약에만 의존한다. 그래서 테스트에서
//                  가짜(fake) 구현을 꽂아 검증할 수 있다.
//
// 인터페이스(계약)와 타입은 이미 완성되어 있다(수정 금지).
// 여러분이 채울 것은 throw new Error('TODO') 로 비어 있는 클래스 본문들이다.

// ── 도메인 타입 (수정 금지) ───────────────────────────────────
export interface Book {
  id: string;
  title: string;
}

/** 대출 기록: 어떤 책을, 언제 빌렸고, 언제까지가 반납 기한인가 */
export interface LoanRecord {
  bookId: string;
  memberId: string;
  /** 대출일 (epoch millis) */
  borrowedAt: number;
  /** 반납 기한 (epoch millis) */
  dueAt: number;
}

/** 대출/반납 결과 */
export interface LendingResult {
  success: boolean;
  reason: string;
}

// ── 계약들 (수정 금지) ────────────────────────────────────────

/**
 * [계약] 시계 — "지금이 몇 시인가"를 추상화한다.
 * 실시간 대신 고정 시각을 주입하면 테스트가 결정적(deterministic)이 된다.
 */
export interface Clock {
  /** 현재 시각 (epoch millis) */
  now(): number;
}

/**
 * [계약] 대출 저장소 — 진행 중인 대출을 보관/조회/삭제한다.
 */
export interface LoanRepository {
  /** 대출 기록을 저장한다 */
  save(loan: LoanRecord): void;
  /** 특정 회원의 진행 중 대출 개수 */
  countByMember(memberId: string): number;
  /** 특정 책이 지금 대출 중이면 그 기록을, 아니면 undefined */
  findByBook(bookId: string): LoanRecord | undefined;
  /** 특정 책의 대출 기록을 삭제한다(반납 처리) */
  remove(bookId: string): void;
}

/**
 * [계약] 연체료 정책 — 연체 일수를 받아 부과할 금액을 계산한다.
 * 구현마다 계산 방식이 다르다(다형성).
 */
export interface LateFeePolicy {
  /** 이 정책의 이름 (예: 'free', 'flat', 'tiered') */
  readonly name: string;
  /** 연체 일수(0 이상)를 받아 연체료(0 이상)를 돌려준다 */
  fee(daysLate: number): number;
}

/**
 * [계약] 감사 로그 — 서비스가 무슨 일을 했는지 기록한다.
 * 테스트에서 "무엇이 기록됐는지"로 동작을 검증한다.
 */
export interface AuditLog {
  record(entry: string): void;
}

// ── 연체료 정책 구현체들 (다형성) ─────────────────────────────

/**
 * 연체료 없음: 며칠을 연체하든 항상 0원.
 * name 은 'free'.
 */
export class FreePolicy implements LateFeePolicy {
  readonly name: string = 'free';

  fee(daysLate: number): number {
    throw new Error('TODO');
  }
}

/**
 * 정액 연체료: 하루당 perDay 원을 부과한다(perDay 는 생성자로 받는다).
 * 즉 daysLate * perDay. name 은 'flat'.
 */
export class FlatPolicy implements LateFeePolicy {
  readonly name: string = 'flat';

  constructor(private readonly perDay: number) {}

  fee(daysLate: number): number {
    throw new Error('TODO');
  }
}

/**
 * 누진 연체료:
 *   - 앞의 7일까지는 하루 100원.
 *   - 8일째부터는 하루 300원.
 * 예) 5일 연체 => 500,  10일 연체 => 700 + 900 = 1600.
 * name 은 'tiered'.
 */
export class TieredPolicy implements LateFeePolicy {
  readonly name: string = 'tiered';

  fee(daysLate: number): number {
    throw new Error('TODO');
  }
}

// ── 회원 등급 (추상 클래스 + 템플릿 메서드) ──────────────────

/**
 * [추상 클래스] 회원 카드.
 *
 * describe()는 모든 등급이 공유하는 "뼈대"다(템플릿 메서드) — 자식이 오버라이드하지 않는다.
 * 대신 달라지는 조각 두 개(maxLoans, loanPeriodDays)를 자식이 채운다(protected abstract).
 *
 * describe()가 돌려줄 정확한 형식(토씨까지 지킬 것):
 *   `${grade} 회원: 최대 ${maxLoans}권, ${loanPeriodDays}일 대출`
 * 예) STANDARD 회원: 최대 3권, 14일 대출
 *
 * grade 는 생성자에서 받아 protected 로 보관한다.
 */
export abstract class MembershipCard {
  constructor(protected readonly grade: string) {}

  /** 이 등급이 동시에 빌릴 수 있는 최대 권수 */
  protected abstract maxLoans(): number;
  /** 이 등급의 대출 기간(일) */
  protected abstract loanPeriodDays(): number;

  /** 템플릿 메서드 — 자식이 채운 조각으로 공통 문장을 조립한다 */
  describe(): string {
    throw new Error('TODO');
  }

  /** 외부(서비스)가 한도를 물어볼 때 쓰는 공개 접근자 */
  limit(): number {
    throw new Error('TODO');
  }

  /** 외부(서비스)가 대출 기간을 물어볼 때 쓰는 공개 접근자 */
  periodDays(): number {
    throw new Error('TODO');
  }
}

/**
 * 일반 회원: 최대 3권, 14일 대출. grade 문자열은 'STANDARD'.
 */
export class StandardCard extends MembershipCard {
  constructor() {
    super('STANDARD');
  }

  protected maxLoans(): number {
    throw new Error('TODO');
  }

  protected loanPeriodDays(): number {
    throw new Error('TODO');
  }
}

/**
 * 프리미엄 회원: 최대 10권, 30일 대출. grade 문자열은 'PREMIUM'.
 */
export class PremiumCard extends MembershipCard {
  constructor() {
    super('PREMIUM');
  }

  protected maxLoans(): number {
    throw new Error('TODO');
  }

  protected loanPeriodDays(): number {
    throw new Error('TODO');
  }
}

// ── 인메모리 저장소 ───────────────────────────────────────────

/**
 * 인메모리 대출 저장소.
 * 내부에 진행 중 대출을 bookId 기준으로 보관한다(한 책은 동시에 하나의 대출만 존재).
 * 없는 책을 findByBook 하면 undefined, remove 는 없으면 조용히 무시한다.
 */
export class InMemoryLoanRepository implements LoanRepository {
  private readonly loans = new Map<string, LoanRecord>();

  save(loan: LoanRecord): void {
    throw new Error('TODO');
  }

  countByMember(memberId: string): number {
    throw new Error('TODO');
  }

  findByBook(bookId: string): LoanRecord | undefined {
    throw new Error('TODO');
  }

  remove(bookId: string): void {
    throw new Error('TODO');
  }
}

/**
 * 배열에 모아두는 감사 로그(테스트에서 확인용).
 */
export class CollectingAuditLog implements AuditLog {
  private readonly entries: string[] = [];

  record(entry: string): void {
    throw new Error('TODO');
  }

  /** 지금까지 기록된 항목 (복사본) */
  getEntries(): string[] {
    throw new Error('TODO');
  }
}

// ── 계약에만 의존하는 서비스 (조합 + DIP) ────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 대출 서비스 — 네 협력자(repository / clock / policy / audit)를 계약 타입으로
 * 주입받는다. 구체 클래스는 전혀 모른다(DIP). 각 협력자에 위임한다(조합).
 *
 * ── borrow(book, memberId, card): LendingResult ──
 *   1) 대출 중복: repository.findByBook(book.id) 가 존재하면
 *      실패 { success:false, reason:'이미 대출 중' }.
 *      이때 audit 에 `대출 거절: ${book.id} (이미 대출 중)` 을 기록하고, 저장은 하지 않는다.
 *   2) 한도 초과: repository.countByMember(memberId) 가 card.limit() 이상이면
 *      실패 { success:false, reason:'대출 한도 초과' }.
 *      audit 에 `대출 거절: ${memberId} (한도 초과)` 를 기록하고, 저장하지 않는다.
 *   3) 성공: borrowedAt = clock.now(),
 *            dueAt = borrowedAt + card.periodDays() * DAY_MS 로 LoanRecord 를 만들어
 *            repository.save 하고,
 *            audit 에 `대출: ${book.id} -> ${memberId}` 를 기록,
 *            { success:true, reason:'대출 완료' } 반환.
 *   (순서 중요: 실패 시 그 뒤 단계의 부작용(저장)이 절대 일어나면 안 된다.)
 *
 * ── returnBook(bookId): number ──
 *   반납 처리 후 "부과할 연체료"를 돌려준다.
 *   - repository.findByBook(bookId) 가 없으면(대출 기록 없음)
 *     audit 에 `반납 실패: ${bookId} (대출 기록 없음)` 기록 후 0 반환.
 *   - 있으면 연체 일수 계산:
 *       daysLate = 기한(dueAt)을 지난 경과 일수. 올림이 아니라 "완전히 지난 날 수"로 센다.
 *       즉 clock.now() 가 dueAt 이하이면 0,
 *       초과하면 Math.floor((now - dueAt) / DAY_MS) 로 계산한다.
 *     연체료 = policy.fee(daysLate).
 *     repository.remove(bookId) 로 기록을 지우고,
 *     audit 에 `반납: ${bookId} (연체 ${daysLate}일, 연체료 ${fee}원)` 기록 후 fee 반환.
 */
export class LendingService {
  constructor(
    private readonly repository: LoanRepository,
    private readonly clock: Clock,
    private readonly policy: LateFeePolicy,
    private readonly audit: AuditLog,
  ) {}

  borrow(book: Book, memberId: string, card: MembershipCard): LendingResult {
    throw new Error('TODO');
  }

  returnBook(bookId: string): number {
    throw new Error('TODO');
  }
}
