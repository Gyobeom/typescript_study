import { EventLog, Timestamped } from '@stage3/review-event-log';

// 테스트에서 쓸 예시 이벤트 타입 (Timestamped 계약을 만족).
interface ClickEvent extends Timestamped {
  at: number;
  userId: string;
  target: string;
  count: number;
}

function seed(): EventLog<ClickEvent> {
  const log = new EventLog<ClickEvent>();
  log.record({ at: 100, userId: 'u1', target: 'btnA', count: 1 });
  log.record({ at: 200, userId: 'u2', target: 'btnB', count: 5 });
  log.record({ at: 300, userId: 'u1', target: 'btnC', count: 2 });
  return log;
}

describe('복습 — EventLog<T> 기본 동작', () => {
  it('record는 기록한 이벤트를 그대로 반환한다', () => {
    const log = new EventLog<ClickEvent>();
    const e = { at: 1, userId: 'u1', target: 't', count: 1 };
    expect(log.record(e)).toEqual(e);
  });

  it('all은 기록된 순서 그대로 반환한다', () => {
    const log = seed();
    expect(log.all().map((e) => e.at)).toEqual([100, 200, 300]);
  });

  it('all은 내부 배열이 아닌 사본을 반환한다', () => {
    const log = seed();
    log.all().push({ at: 999, userId: 'x', target: 'x', count: 0 });
    expect(log.size()).toBe(3);
  });

  it('last는 가장 마지막 이벤트를, 비어 있으면 undefined를 반환한다', () => {
    expect(seed().last()?.at).toBe(300);
    expect(new EventLog<ClickEvent>().last()).toBeUndefined();
  });

  it('since(at)은 at 이후(포함) 이벤트만 반환한다', () => {
    const log = seed();
    expect(log.since(200).map((e) => e.at)).toEqual([200, 300]);
  });
});

describe('복습 — EventLog<T> keyof / T[K] 사영', () => {
  it('field는 특정 프로퍼티만 뽑아 배열로 반환한다', () => {
    const log = seed();
    expect(log.field('userId')).toEqual(['u1', 'u2', 'u1']);
    expect(log.field('count')).toEqual([1, 5, 2]);
  });

  it('summaryOf는 지정한 키만 남긴 부분 객체 배열을 반환한다', () => {
    const log = seed();
    expect(log.summaryOf(['at', 'userId'])).toEqual([
      { at: 100, userId: 'u1' },
      { at: 200, userId: 'u2' },
      { at: 300, userId: 'u1' },
    ]);
  });
});

describe('복습 — EventLog<T> amend 부분 갱신', () => {
  it('마지막 이벤트를 부분 갱신하고 나머지는 보존한다', () => {
    const log = seed();
    const updated = log.amend({ count: 42 });
    expect(updated).toEqual({ at: 300, userId: 'u1', target: 'btnC', count: 42 });
    expect(log.last()?.count).toBe(42);
  });

  it('비어 있으면 amend는 undefined를 반환한다', () => {
    expect(new EventLog<ClickEvent>().amend({ count: 1 })).toBeUndefined();
  });
});

describe('복습 — EventLog<T> 타입 레벨 검증', () => {
  it('타입 레벨: field는 존재하지 않는 키를 거부한다', () => {
    const log = seed();
    // @ts-expect-error 'nope'는 ClickEvent의 키가 아니다 (K extends keyof T)
    log.field('nope');
    expect(log.size()).toBe(3);
  });

  it('타입 레벨: amend로 at(불변 시각)은 바꿀 수 없다', () => {
    const log = seed();
    // @ts-expect-error at은 Omit으로 제외되어 patch에 넣을 수 없다
    log.amend({ at: 999 });
    expect(log.last()?.at).toBe(300);
  });

  it('타입 레벨: field 반환값의 원소 타입이 T[K]로 좁혀진다', () => {
    const log = seed();
    const counts: number[] = log.field('count');
    // @ts-expect-error count는 number[]이므로 string[]에 대입할 수 없다
    const wrong: string[] = log.field('count');
    expect(counts.length).toBe(3);
    expect(wrong.length).toBe(3);
  });
});
