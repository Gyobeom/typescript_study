import { Point } from '@stage1/day1-point';

describe('Day 1 — Point 클래스', () => {
  it('생성자로 좌표를 초기화한다', () => {
    const p = new Point(3, 4);
    expect(p.x).toBe(3);
    expect(p.y).toBe(4);
  });

  it('원점으로부터의 거리를 계산한다 (3, 4) → 5', () => {
    const p = new Point(3, 4);
    expect(p.distanceFromOrigin()).toBeCloseTo(5);
  });

  it('다른 점까지의 거리를 계산한다', () => {
    const a = new Point(0, 0);
    const b = new Point(6, 8);
    expect(a.distanceTo(b)).toBeCloseTo(10);
  });

  it('translate 는 원본을 바꾸지 않고 새 Point 를 반환한다', () => {
    const p = new Point(1, 1);
    const moved = p.translate(2, 3);
    expect(moved.x).toBe(3);
    expect(moved.y).toBe(4);
    // 원본 불변 확인
    expect(p.x).toBe(1);
    expect(p.y).toBe(1);
    expect(moved).not.toBe(p);
  });

  it('toString 은 "(x, y)" 형식이다', () => {
    expect(new Point(1, 2).toString()).toBe('(1, 2)');
  });
});
