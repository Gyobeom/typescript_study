// Day 2 — 접근제어자 public / private / protected / readonly, 캡슐화
//
// 은행 계좌(BankAccount)를 구현하라.
// 핵심 규칙: 잔액(balance)은 외부에서 "직접" 수정할 수 없어야 한다.
//           입금/출금은 반드시 메서드를 통해서만 이루어진다(캡슐화).

export class BankAccount {
  // 계좌번호는 생성 후 절대 바뀌지 않는다 → readonly, 외부 조회는 허용 → public
  public readonly accountNumber: string;

  // 힌트: 잔액은 외부에서 직접 못 바꾸도록 private 로 선언한다.
  //       조회는 아래 getBalance() 메서드로만 노출한다.
  private balance: number;

  constructor(accountNumber: string, initialBalance: number = 0) {
    // 힌트: initialBalance 가 음수면 Error('...') 를 throw 한다.
    //       accountNumber 와 balance 를 초기화한다.
    throw new Error('TODO: 계좌를 초기화하라 (음수 초기잔액 거부)');
  }

  // 현재 잔액을 반환한다(읽기 전용 노출).
  getBalance(): number {
    // 힌트: this.balance 를 반환한다.
    throw new Error('TODO: 잔액을 반환하라');
  }

  // 입금. amount 는 0보다 커야 한다. 위반 시 Error.
  deposit(amount: number): void {
    // 힌트: amount <= 0 이면 throw. 아니면 balance 에 더한다.
    throw new Error('TODO: 입금을 처리하라');
  }

  // 출금. amount 는 0보다 크고 잔액 이하여야 한다. 위반 시 Error.
  withdraw(amount: number): void {
    // 힌트: amount <= 0 → throw, amount > balance → Error('잔액 부족') throw.
    throw new Error('TODO: 출금을 처리하라');
  }
}
