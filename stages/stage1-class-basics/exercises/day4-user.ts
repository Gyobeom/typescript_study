// Day 4 — static 멤버, 인스턴스 vs 클래스 레벨
//
// User 클래스를 구현하라.
// - 인스턴스마다 고유한 id 가 자동 부여된다(1부터 증가).
// - 지금까지 생성된 User 총 개수를 클래스 레벨에서 셀 수 있다.
// - 이메일 문자열로부터 User 를 만드는 정적 팩토리 메서드를 제공한다.
//
// 인스턴스 레벨(각 객체가 따로 가짐) vs 클래스 레벨(모든 객체가 공유)의 차이를 체감한다.

export class User {
  // 힌트: 다음에 부여할 id 와 총 생성 개수를 담을 private static 필드를 만든다.
  //       static 필드는 인스턴스가 아니라 "클래스 자체"에 딱 하나 존재한다.
  private static nextId: number = 1;
  private static count: number = 0;

  public readonly id: number;

  constructor(public readonly name: string, public readonly email: string) {
    // 힌트: this.id 에 User.nextId 를 부여하고 nextId++ / count++ 를 한다.
    //       (id 는 readonly 라 생성자 안에서만 대입 가능)
    throw new Error('TODO: id 자동 부여 및 카운터 증가');
  }

  // 지금까지 생성된 User 총 개수를 반환하는 정적 메서드.
  static getCount(): number {
    // 힌트: User.count 반환
    throw new Error('TODO: 총 생성 개수 반환');
  }

  // "이름 <이메일>" 형태 문자열을 파싱해 User 를 만드는 정적 팩토리.
  // 예: "Alice <alice@example.com>" → new User('Alice', 'alice@example.com')
  // 형식이 맞지 않으면 Error 를 던진다.
  static fromString(input: string): User {
    // 힌트: 정규식 /^(.+?)\s*<(.+?)>$/ 로 이름과 이메일을 추출한다.
    //       매치 실패 시 throw. 성공 시 new User(name, email) 반환.
    throw new Error('TODO: 문자열에서 User 를 생성하는 팩토리');
  }

  // 테스트 격리를 위한 카운터 초기화(실무에서는 잘 안 쓰지만 학습용).
  static resetCounter(): void {
    // 힌트: nextId 를 1, count 를 0 으로 되돌린다.
    throw new Error('TODO: 카운터 초기화');
  }
}
