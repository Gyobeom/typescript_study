import { BankAccount } from '@stage1/day2-bank-account';

describe('Day 2 — BankAccount 캡슐화', () => {
  it('초기 잔액과 계좌번호로 생성된다', () => {
    const acc = new BankAccount('1002-333', 1000);
    expect(acc.accountNumber).toBe('1002-333');
    expect(acc.getBalance()).toBe(1000);
  });

  it('초기 잔액 기본값은 0이다', () => {
    const acc = new BankAccount('1002-000');
    expect(acc.getBalance()).toBe(0);
  });

  it('음수 초기 잔액은 거부하되 유효한 잔액은 허용한다', () => {
    // 정상 입력은 성공해야 하고(무조건 throw 하는 스켈레톤은 여기서 실패한다)
    const ok = new BankAccount('1002-999', 10);
    expect(ok.getBalance()).toBe(10);
    // 음수 초기 잔액만 거부한다
    expect(() => new BankAccount('1002-999', -1)).toThrow();
  });

  it('입금하면 잔액이 늘어난다', () => {
    const acc = new BankAccount('x', 100);
    acc.deposit(50);
    expect(acc.getBalance()).toBe(150);
  });

  it('0 이하 입금은 거부한다', () => {
    const acc = new BankAccount('x', 100);
    expect(() => acc.deposit(0)).toThrow();
    expect(() => acc.deposit(-10)).toThrow();
  });

  it('출금하면 잔액이 줄어든다', () => {
    const acc = new BankAccount('x', 100);
    acc.withdraw(30);
    expect(acc.getBalance()).toBe(70);
  });

  it('잔액을 초과하는 출금은 거부한다', () => {
    const acc = new BankAccount('x', 100);
    expect(() => acc.withdraw(101)).toThrow();
    expect(acc.getBalance()).toBe(100);
  });

  it('balance 는 외부에서 직접 수정할 수 없다 (컴파일 타임 캡슐화)', () => {
    const acc = new BankAccount('x', 100);
    // @ts-expect-error balance 는 private 이므로 외부 접근 불가
    acc.balance = 999999;
    // 런타임에서도 정상 경로(getBalance)로만 다뤄져야 한다.
    // (위 라인은 컴파일 에러가 기대되지만, 실행 시 무결성은 getBalance 로 확인)
    expect(typeof acc.getBalance()).toBe('number');
  });

  it('accountNumber 는 readonly 라 재할당할 수 없다', () => {
    const acc = new BankAccount('x', 0);
    // @ts-expect-error accountNumber 는 readonly
    acc.accountNumber = 'y';
    expect(acc.accountNumber).toBeDefined();
  });
});
