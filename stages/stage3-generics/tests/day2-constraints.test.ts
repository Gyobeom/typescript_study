import { LengthTracker, PropertyPicker } from '@stage3/day2-constraints';

describe('Day 2 — LengthTracker<T extends { length: number }>', () => {
  it('문자열의 length 합계를 구한다', () => {
    const tracker = new LengthTracker<string>();
    tracker.add('ab');
    tracker.add('cde');
    expect(tracker.totalLength()).toBe(5);
  });

  it('배열도 length가 있으므로 담을 수 있고 longest를 찾는다', () => {
    const tracker = new LengthTracker<number[]>();
    tracker.add([1]);
    tracker.add([1, 2, 3]);
    tracker.add([1, 2]);
    expect(tracker.longest()).toEqual([1, 2, 3]);
  });

  it('비어 있으면 totalLength는 0, longest는 undefined', () => {
    const tracker = new LengthTracker<string>();
    expect(tracker.totalLength()).toBe(0);
    expect(tracker.longest()).toBeUndefined();
  });

  it('타입 레벨: length 없는 타입은 거부된다', () => {
    const tracker = new LengthTracker<{ length: number }>();
    // @ts-expect-error length 프로퍼티가 없는 값은 add 할 수 없다
    tracker.add({ name: 'no-length' });
    expect(tracker).toBeDefined();
  });
});

describe('Day 2 — PropertyPicker<T> + keyof', () => {
  const user = { id: 1, name: 'kim', active: true };

  it('pluck으로 키에 해당하는 값을 정확한 타입으로 꺼낸다', () => {
    const picker = new PropertyPicker(user);
    expect(picker.pluck('name')).toBe('kim');
    expect(picker.pluck('id')).toBe(1);
    expect(picker.pluck('active')).toBe(true);
  });

  it('pick으로 여러 키를 골라 부분 객체를 만든다', () => {
    const picker = new PropertyPicker(user);
    expect(picker.pick(['id', 'name'])).toEqual({ id: 1, name: 'kim' });
  });

  it('타입 레벨: 존재하지 않는 키는 거부된다', () => {
    const picker = new PropertyPicker(user);
    // @ts-expect-error 'email'은 user의 키가 아니다
    picker.pluck('email');
    expect(picker).toBeDefined();
  });
});
