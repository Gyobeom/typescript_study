// Day 2 — 모범 답안
// private 로 잔액을 숨기고, 메서드로만 상태를 바꾸는 캡슐화의 전형.

export class BankAccount {
  public readonly accountNumber: string;
  private balance: number;

  constructor(accountNumber: string, initialBalance: number = 0) {
    if (initialBalance < 0) {
      throw new Error('초기 잔액은 음수일 수 없다');
    }
    this.accountNumber = accountNumber;
    this.balance = initialBalance;
  }

  getBalance(): number {
    return this.balance;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('입금액은 0보다 커야 한다');
    }
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error('출금액은 0보다 커야 한다');
    }
    if (amount > this.balance) {
      throw new Error('잔액 부족');
    }
    this.balance -= amount;
  }
}
