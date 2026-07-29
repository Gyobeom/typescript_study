import { Temperature } from '@stage1/day3-temperature';

describe('Day 3 — Temperature 파라미터 프로퍼티 & getter/setter', () => {
  it('섭씨로 생성하고 c getter 로 읽는다', () => {
    const t = new Temperature(25);
    expect(t.c).toBe(25);
  });

  it('화씨 getter 로 변환값을 읽는다 (0℃ → 32℉, 100℃ → 212℉)', () => {
    expect(new Temperature(0).f).toBeCloseTo(32);
    expect(new Temperature(100).f).toBeCloseTo(212);
  });

  it('c setter 로 섭씨를 바꾸면 화씨도 함께 반영된다', () => {
    const t = new Temperature(0);
    t.c = 100;
    expect(t.c).toBe(100);
    expect(t.f).toBeCloseTo(212);
  });

  it('f setter 로 화씨를 설정하면 내부 섭씨로 변환 저장된다 (212℉ → 100℃)', () => {
    const t = new Temperature(0);
    t.f = 212;
    expect(t.c).toBeCloseTo(100);
  });

  it('절대영도 미만 생성은 거부하되 그 이상은 허용한다', () => {
    // 유효 온도는 생성돼야 하고(무조건 throw 하는 스켈레톤은 여기서 실패)
    expect(new Temperature(-273).c).toBe(-273);
    // 절대영도 미만만 거부한다
    expect(() => new Temperature(-300)).toThrow();
  });

  it('절대영도 미만 setter 도 거부한다', () => {
    const t = new Temperature(0);
    expect(() => {
      t.c = -300;
    }).toThrow();
    // 거부되었으므로 값은 유지
    expect(t.c).toBe(0);
  });

  it('celsius 필드는 private 이라 외부 직접 접근 불가', () => {
    const t = new Temperature(0);
    // @ts-expect-error celsius 는 private
    void t.celsius;
    expect(t.c).toBe(0);
  });
});
