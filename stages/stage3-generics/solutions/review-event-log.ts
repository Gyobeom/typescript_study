// 복습 — 제네릭 클래스 종합 (풀이)
//
// 도메인: EventLog<T> — 시간순으로 쌓이는 타임스탬프 이벤트 로그.

/** 모든 이벤트가 최소한 가져야 하는 계약: 발생 시각(epoch ms). */
export interface Timestamped {
  at: number;
}

/**
 * 시간순으로 쌓이는 타임스탬프 이벤트 로그.
 * T extends Timestamped 제약 덕에 내부에서 event.at 에 안전히 접근할 수 있다.
 */
export class EventLog<T extends Timestamped> {
  private events: T[] = [];

  record(event: T): T {
    this.events.push(event);
    return event;
  }

  all(): T[] {
    return [...this.events];
  }

  size(): number {
    return this.events.length;
  }

  last(): T | undefined {
    return this.events[this.events.length - 1];
  }

  since(at: number): T[] {
    return this.events.filter((event) => event.at >= at);
  }

  /**
   * K extends keyof T 로 "실제 존재하는 키만" 받고,
   * 반환은 T[K][] 로 그 키가 가리키는 값의 타입 배열이 된다.
   */
  field<K extends keyof T>(key: K): T[K][] {
    return this.events.map((event) => event[key]);
  }

  summaryOf<K extends keyof T>(keys: K[]): Pick<T, K>[] {
    return this.events.map((event) => {
      const out = {} as Pick<T, K>;
      for (const k of keys) {
        out[k] = event[k];
      }
      return out;
    });
  }

  /**
   * Partial<Omit<T, 'at'>> : at 은 제외(불변), 나머지는 부분 갱신 허용.
   */
  amend(patch: Partial<Omit<T, 'at'>>): T | undefined {
    const current = this.last();
    if (!current) return undefined;
    const updated = { ...current, ...patch, at: current.at };
    this.events[this.events.length - 1] = updated;
    return updated;
  }
}
