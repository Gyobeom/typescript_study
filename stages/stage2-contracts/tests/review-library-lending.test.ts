// 복습 테스트 — 도서관 대출 시스템
import {
  Book,
  Clock,
  LoanRepository,
  LateFeePolicy,
  AuditLog,
  FreePolicy,
  FlatPolicy,
  TieredPolicy,
  StandardCard,
  PremiumCard,
  InMemoryLoanRepository,
  CollectingAuditLog,
  LendingService,
} from '@stage2/review-library-lending';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 고정 시각을 반환하는 테스트용 시계 */
function fixedClock(at: number): Clock {
  return { now: () => at };
}

const anyBook: Book = { id: 'b1', title: '클린 아키텍처' };

describe('복습: 도서관 대출 — 연체료 정책 다형성', () => {
  test('FreePolicy 는 며칠을 연체하든 항상 0원이다', () => {
    const p = new FreePolicy();
    expect(p.name).toBe('free');
    expect(p.fee(0)).toBe(0);
    expect(p.fee(100)).toBe(0);
  });

  test('FlatPolicy 는 하루당 정액을 부과한다', () => {
    const p = new FlatPolicy(200);
    expect(p.name).toBe('flat');
    expect(p.fee(0)).toBe(0);
    expect(p.fee(5)).toBe(1000);
  });

  test('TieredPolicy 는 7일까지 100원, 이후 300원으로 누진한다', () => {
    const p = new TieredPolicy();
    expect(p.name).toBe('tiered');
    expect(p.fee(5)).toBe(500); // 5 * 100
    expect(p.fee(7)).toBe(700); // 7 * 100
    expect(p.fee(10)).toBe(1600); // 700 + 3 * 300
  });

  test('계약만 아는 함수는 어떤 정책 구현이 와도 동작한다 (다형성)', () => {
    const total = (policy: LateFeePolicy, days: number): string =>
      `${policy.name}:${policy.fee(days)}`;

    const policies: LateFeePolicy[] = [new FreePolicy(), new FlatPolicy(100), new TieredPolicy()];
    const results = policies.map((p) => total(p, 10));
    expect(results).toEqual(['free:0', 'flat:1000', 'tiered:1600']);
  });
});

describe('복습: 회원 카드 — 추상 클래스 + 템플릿 메서드', () => {
  test('describe() 뼈대는 공통이고 조각만 등급별로 달라진다', () => {
    expect(new StandardCard().describe()).toBe('STANDARD 회원: 최대 3권, 14일 대출');
    expect(new PremiumCard().describe()).toBe('PREMIUM 회원: 최대 10권, 30일 대출');
  });

  test('공개 접근자 limit()/periodDays() 로 등급 정책을 읽을 수 있다', () => {
    const std = new StandardCard();
    expect(std.limit()).toBe(3);
    expect(std.periodDays()).toBe(14);

    const prem = new PremiumCard();
    expect(prem.limit()).toBe(10);
    expect(prem.periodDays()).toBe(30);
  });
});

describe('복습: 인메모리 저장소', () => {
  test('save/countByMember/findByBook/remove 가 계약대로 동작한다', () => {
    const repo = new InMemoryLoanRepository();
    expect(repo.findByBook('b1')).toBeUndefined();
    expect(repo.countByMember('m1')).toBe(0);

    repo.save({ bookId: 'b1', memberId: 'm1', borrowedAt: 0, dueAt: DAY_MS });
    repo.save({ bookId: 'b2', memberId: 'm1', borrowedAt: 0, dueAt: DAY_MS });
    repo.save({ bookId: 'b3', memberId: 'm2', borrowedAt: 0, dueAt: DAY_MS });

    expect(repo.countByMember('m1')).toBe(2);
    expect(repo.findByBook('b1')?.memberId).toBe('m1');

    repo.remove('b1');
    expect(repo.findByBook('b1')).toBeUndefined();
    expect(repo.countByMember('m1')).toBe(1);
    repo.remove('nope'); // 없는 것 삭제는 조용히 무시
  });
});

describe('복습: 대출 서비스 (조합 + DIP)', () => {
  test('정상 대출: 기한 계산 + 저장 + 감사 로그 + 성공 반환', () => {
    const repo = new InMemoryLoanRepository();
    const audit = new CollectingAuditLog();
    const service = new LendingService(repo, fixedClock(1000), new FreePolicy(), audit);

    const result = service.borrow(anyBook, 'm1', new StandardCard());
    expect(result).toEqual({ success: true, reason: '대출 완료' });

    const loan = repo.findByBook('b1');
    expect(loan?.borrowedAt).toBe(1000);
    expect(loan?.dueAt).toBe(1000 + 14 * DAY_MS); // STANDARD = 14일
    expect(audit.getEntries()).toEqual(['대출: b1 -> m1']);
  });

  test('이미 대출 중인 책은 거절하고 저장 부작용이 없다', () => {
    const repo = new InMemoryLoanRepository();
    const audit = new CollectingAuditLog();
    const service = new LendingService(repo, fixedClock(0), new FreePolicy(), audit);
    service.borrow(anyBook, 'm1', new StandardCard());

    const result = service.borrow(anyBook, 'm2', new StandardCard());
    expect(result).toEqual({ success: false, reason: '이미 대출 중' });
    // 여전히 원래 대출자(m1)의 것 하나뿐 — 새 저장 없음
    expect(repo.findByBook('b1')?.memberId).toBe('m1');
    expect(audit.getEntries()).toEqual(['대출: b1 -> m1', '대출 거절: b1 (이미 대출 중)']);
  });

  test('한도 초과 시 거절하고 저장하지 않는다 (early return)', () => {
    const repo = new InMemoryLoanRepository();
    const audit = new CollectingAuditLog();
    const service = new LendingService(repo, fixedClock(0), new FreePolicy(), audit);
    // STANDARD 한도 3권을 이미 채움
    repo.save({ bookId: 'x1', memberId: 'm1', borrowedAt: 0, dueAt: DAY_MS });
    repo.save({ bookId: 'x2', memberId: 'm1', borrowedAt: 0, dueAt: DAY_MS });
    repo.save({ bookId: 'x3', memberId: 'm1', borrowedAt: 0, dueAt: DAY_MS });

    const result = service.borrow(anyBook, 'm1', new StandardCard());
    expect(result).toEqual({ success: false, reason: '대출 한도 초과' });
    expect(repo.findByBook('b1')).toBeUndefined(); // 새 책 저장 안 됨
    expect(audit.getEntries()).toEqual(['대출 거절: m1 (한도 초과)']);
  });

  test('반납: 기한 내면 연체료 0, 기록 삭제, 감사 로그', () => {
    const repo = new InMemoryLoanRepository();
    const audit = new CollectingAuditLog();
    const service = new LendingService(repo, fixedClock(1000), new FlatPolicy(100), audit);
    service.borrow(anyBook, 'm1', new StandardCard()); // due = 1000 + 14일

    const fee = service.returnBook('b1');
    expect(fee).toBe(0);
    expect(repo.findByBook('b1')).toBeUndefined();
    expect(audit.getEntries()).toContain('반납: b1 (연체 0일, 연체료 0원)');
  });

  test('반납: 연체 일수를 완전히 지난 날 수로 세고 정책에 위임한다', () => {
    const repo = new InMemoryLoanRepository();
    const audit = new CollectingAuditLog();
    // borrow 시각 0, due = 14일. 반납 시각 = due + 3.5일 => 연체 3일(floor)
    const returnAt = 14 * DAY_MS + Math.floor(3.5 * DAY_MS);
    const service = new LendingService(repo, fixedClock(returnAt), new FlatPolicy(100), audit);
    repo.save({ bookId: 'b1', memberId: 'm1', borrowedAt: 0, dueAt: 14 * DAY_MS });

    const fee = service.returnBook('b1');
    expect(fee).toBe(300); // 3일 * 100
    expect(audit.getEntries()).toContain('반납: b1 (연체 3일, 연체료 300원)');
  });

  test('반납: 대출 기록이 없으면 0 반환 + 실패 로그', () => {
    const repo = new InMemoryLoanRepository();
    const audit = new CollectingAuditLog();
    const service = new LendingService(repo, fixedClock(0), new FreePolicy(), audit);

    const fee = service.returnBook('ghost');
    expect(fee).toBe(0);
    expect(audit.getEntries()).toEqual(['반납 실패: ghost (대출 기록 없음)']);
  });

  test('서비스는 계약에만 의존하므로 즉석 가짜 구현으로도 동작한다 (DIP)', () => {
    const saved: string[] = [];
    const recorded: string[] = [];
    // 클래스 없이 객체 리터럴로 계약을 채운 가짜 협력자들
    const repo: LoanRepository = {
      save: (loan) => saved.push(loan.bookId),
      countByMember: () => 0,
      findByBook: () => undefined,
      remove: () => {},
    };
    const clock: Clock = { now: () => 42 };
    const policy: LateFeePolicy = { name: 'fake', fee: () => 0 };
    const audit: AuditLog = { record: (e) => recorded.push(e) };

    const service = new LendingService(repo, clock, policy, audit);
    const result = service.borrow(anyBook, 'm1', new PremiumCard());

    expect(result.success).toBe(true);
    expect(saved).toEqual(['b1']);
    expect(recorded).toEqual(['대출: b1 -> m1']);
  });
});
