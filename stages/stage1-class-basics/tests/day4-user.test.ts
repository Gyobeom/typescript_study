import { User } from '@stage1/day4-user';

describe('Day 4 — User static 멤버', () => {
  beforeEach(() => {
    // 각 테스트 전에 클래스 레벨 카운터를 초기화한다(테스트 격리).
    User.resetCounter();
  });

  it('id 는 1부터 자동 증가한다', () => {
    const a = new User('Alice', 'alice@example.com');
    const b = new User('Bob', 'bob@example.com');
    expect(a.id).toBe(1);
    expect(b.id).toBe(2);
  });

  it('getCount 는 생성된 총 인스턴스 수를 반환한다', () => {
    expect(User.getCount()).toBe(0);
    new User('A', 'a@x.com');
    new User('B', 'b@x.com');
    expect(User.getCount()).toBe(2);
  });

  it('fromString 팩토리로 User 를 만든다', () => {
    const u = User.fromString('Alice <alice@example.com>');
    expect(u.name).toBe('Alice');
    expect(u.email).toBe('alice@example.com');
    expect(u.id).toBe(1);
  });

  it('fromString 은 잘못된 형식을 거부한다', () => {
    expect(() => User.fromString('그냥이름')).toThrow();
  });

  it('id 는 readonly 라 재할당할 수 없다', () => {
    const u = new User('A', 'a@x.com');
    // @ts-expect-error id 는 readonly
    u.id = 999;
    expect(typeof u.id).toBe('number');
  });

  it('count 는 private static 이라 외부에서 직접 접근 불가', () => {
    // @ts-expect-error count 는 private static
    void User.count;
    expect(User.getCount()).toBeGreaterThanOrEqual(0);
  });
});
