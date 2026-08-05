// 복습(인출 연습) — 모범 답안: 도서관 대출 시스템

export interface Book {
  id: string;
  title: string;
}

export interface LoanRecord {
  bookId: string;
  memberId: string;
  borrowedAt: number;
  dueAt: number;
}

export interface LendingResult {
  success: boolean;
  reason: string;
}

export interface Clock {
  now(): number;
}

export interface LoanRepository {
  save(loan: LoanRecord): void;
  countByMember(memberId: string): number;
  findByBook(bookId: string): LoanRecord | undefined;
  remove(bookId: string): void;
}

export interface LateFeePolicy {
  readonly name: string;
  fee(daysLate: number): number;
}

export interface AuditLog {
  record(entry: string): void;
}

// ── 연체료 정책 구현체들 (다형성) ─────────────────────────────

export class FreePolicy implements LateFeePolicy {
  readonly name: string = 'free';

  fee(_daysLate: number): number {
    return 0;
  }
}

export class FlatPolicy implements LateFeePolicy {
  readonly name: string = 'flat';

  constructor(private readonly perDay: number) {}

  fee(daysLate: number): number {
    return daysLate * this.perDay;
  }
}

export class TieredPolicy implements LateFeePolicy {
  readonly name: string = 'tiered';

  fee(daysLate: number): number {
    const firstTierDays = Math.min(daysLate, 7);
    const secondTierDays = Math.max(daysLate - 7, 0);
    return firstTierDays * 100 + secondTierDays * 300;
  }
}

// ── 회원 등급 (추상 클래스 + 템플릿 메서드) ──────────────────

export abstract class MembershipCard {
  constructor(protected readonly grade: string) {}

  protected abstract maxLoans(): number;
  protected abstract loanPeriodDays(): number;

  describe(): string {
    return `${this.grade} 회원: 최대 ${this.maxLoans()}권, ${this.loanPeriodDays()}일 대출`;
  }

  limit(): number {
    return this.maxLoans();
  }

  periodDays(): number {
    return this.loanPeriodDays();
  }
}

export class StandardCard extends MembershipCard {
  constructor() {
    super('STANDARD');
  }

  protected maxLoans(): number {
    return 3;
  }

  protected loanPeriodDays(): number {
    return 14;
  }
}

export class PremiumCard extends MembershipCard {
  constructor() {
    super('PREMIUM');
  }

  protected maxLoans(): number {
    return 10;
  }

  protected loanPeriodDays(): number {
    return 30;
  }
}

// ── 인메모리 저장소 ───────────────────────────────────────────

export class InMemoryLoanRepository implements LoanRepository {
  private readonly loans = new Map<string, LoanRecord>();

  save(loan: LoanRecord): void {
    this.loans.set(loan.bookId, loan);
  }

  countByMember(memberId: string): number {
    let count = 0;
    for (const loan of this.loans.values()) {
      if (loan.memberId === memberId) {
        count += 1;
      }
    }
    return count;
  }

  findByBook(bookId: string): LoanRecord | undefined {
    return this.loans.get(bookId);
  }

  remove(bookId: string): void {
    this.loans.delete(bookId);
  }
}

export class CollectingAuditLog implements AuditLog {
  private readonly entries: string[] = [];

  record(entry: string): void {
    this.entries.push(entry);
  }

  getEntries(): string[] {
    return [...this.entries];
  }
}

// ── 계약에만 의존하는 서비스 (조합 + DIP) ────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

export class LendingService {
  constructor(
    private readonly repository: LoanRepository,
    private readonly clock: Clock,
    private readonly policy: LateFeePolicy,
    private readonly audit: AuditLog,
  ) {}

  borrow(book: Book, memberId: string, card: MembershipCard): LendingResult {
    if (this.repository.findByBook(book.id)) {
      this.audit.record(`대출 거절: ${book.id} (이미 대출 중)`);
      return { success: false, reason: '이미 대출 중' };
    }

    if (this.repository.countByMember(memberId) >= card.limit()) {
      this.audit.record(`대출 거절: ${memberId} (한도 초과)`);
      return { success: false, reason: '대출 한도 초과' };
    }

    const borrowedAt = this.clock.now();
    const dueAt = borrowedAt + card.periodDays() * DAY_MS;
    this.repository.save({ bookId: book.id, memberId, borrowedAt, dueAt });
    this.audit.record(`대출: ${book.id} -> ${memberId}`);
    return { success: true, reason: '대출 완료' };
  }

  returnBook(bookId: string): number {
    const loan = this.repository.findByBook(bookId);
    if (!loan) {
      this.audit.record(`반납 실패: ${bookId} (대출 기록 없음)`);
      return 0;
    }

    const now = this.clock.now();
    const daysLate = now <= loan.dueAt ? 0 : Math.floor((now - loan.dueAt) / DAY_MS);
    const fee = this.policy.fee(daysLate);
    this.repository.remove(bookId);
    this.audit.record(`반납: ${bookId} (연체 ${daysLate}일, 연체료 ${fee}원)`);
    return fee;
  }
}
