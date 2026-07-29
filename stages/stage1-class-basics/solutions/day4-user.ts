// Day 4 — 모범 답안
// static 필드/메서드로 클래스 레벨 상태(공유 카운터)와 팩토리 메서드를 구현.

export class User {
  private static nextId: number = 1;
  private static count: number = 0;

  public readonly id: number;

  constructor(public readonly name: string, public readonly email: string) {
    this.id = User.nextId;
    User.nextId += 1;
    User.count += 1;
  }

  static getCount(): number {
    return User.count;
  }

  static fromString(input: string): User {
    const match = input.match(/^(.+?)\s*<(.+?)>$/);
    if (!match) {
      throw new Error(`잘못된 형식: "${input}" (기대: "이름 <이메일>")`);
    }
    const [, name, email] = match;
    return new User(name.trim(), email.trim());
  }

  static resetCounter(): void {
    User.nextId = 1;
    User.count = 0;
  }
}
