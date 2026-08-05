// 복습 — 제네릭 클래스 종합 (인출 연습용, 힌트 제로)
//
// 이번 스테이지에서 배운 것을 힌트 없이 스스로 꺼내 쓰는 종합 문제다.
// 요구사항 명세만 읽고, 제네릭 선언과 본문을 직접 완성하라.
//
// 도메인: EventLog<T> — 시간순으로 쌓이는 "타임스탬프 이벤트" 로그.
//   서버의 감사 로그(audit log), 텔레메트리 수집, 이벤트 소싱의 축소판이라고 보면 된다.
//
// ★ 오늘은 메서드 "시그니처"도 직접 완성한다.
//   아래 [SIGNATURE] 로 표시된 두 곳은 파라미터/반환 타입(제네릭 선언)까지 스스로 채워야 한다.
//   요구사항 명세만 보고, 컴파일러가 "존재하지 않는 키"나 "불변 필드 변경"을 잡아내도록
//   가장 정확한 제네릭 시그니처를 직접 써라. (본문은 그 다음이다.)
//
// ── 요구사항 ────────────────────────────────────────────────
// [계약]
//   Timestamped: 모든 이벤트는 최소한 at(number, epoch ms)을 가진다.
//
// [EventLog<T>]  (T는 Timestamped를 만족하는 타입만 담을 수 있어야 한다)
//   record(event)         : 이벤트를 하나 기록한다(뒤에 append). 기록한 이벤트를 그대로 반환.
//   all()                 : 기록된 모든 이벤트를 "기록된 순서 그대로" 배열 사본으로 반환(내부 배열 노출 금지).
//   size()                : 기록된 이벤트 개수.
//   last()                : 가장 마지막(최근) 이벤트. 비어 있으면 undefined.
//   since(at)             : at(포함) 이후에 기록된(= event.at >= at) 이벤트만 배열로.
//   field(key)            : 모든 이벤트에서 특정 프로퍼티 하나만 뽑아 배열로. ([SIGNATURE] 참고)
//   summaryOf(keys)       : 각 이벤트를 keys에 해당하는 프로퍼티만 남긴 부분 객체로 사영(projection)해 배열로.
//   amend(patch)          : 마지막 이벤트를 patch로 부분 갱신한다. ([SIGNATURE] 참고)
//                            - 비어 있으면 undefined.
//                            - 있으면 마지막 이벤트를 patch로 덮어써 갱신하고, 갱신된 이벤트를 반환.
//                            - at(발생 시각)은 patch로 바꿀 수 없어야 한다(계약상 시각은 불변).
// ────────────────────────────────────────────────────────────

/** 모든 이벤트가 최소한 가져야 하는 계약: 발생 시각(epoch ms). */
export interface Timestamped {
  at: number;
}

/**
 * 시간순으로 쌓이는 타임스탬프 이벤트 로그.
 * T는 "Timestamped를 만족하는 타입만" 받도록 제약된다.
 */
export class EventLog<T extends Timestamped> {
  private events: T[] = [];

  /** 이벤트를 하나 기록한다(append). 기록한 이벤트를 그대로 반환. */
  record(event: T): T {
    throw new Error('TODO: record 를 구현하세요');
  }

  /** 기록된 모든 이벤트를 기록된 순서 그대로 배열 사본으로 반환(내부 배열 노출 금지). */
  all(): T[] {
    throw new Error('TODO: all 을 구현하세요');
  }

  /** 기록된 이벤트 개수. */
  size(): number {
    throw new Error('TODO: size 를 구현하세요');
  }

  /** 가장 마지막(최근) 이벤트. 비어 있으면 undefined. */
  last(): T | undefined {
    throw new Error('TODO: last 를 구현하세요');
  }

  /** at(포함) 이후에 기록된 이벤트(event.at >= at)만 배열로. */
  since(at: number): T[] {
    throw new Error('TODO: since 를 구현하세요');
  }

  /**
   * 모든 이벤트에서 특정 프로퍼티 하나만 뽑아 배열로.
   *   예: field('userId') → 모든 이벤트의 userId 값 배열.
   *
   * ★ [SIGNATURE] 이 메서드의 제네릭 파라미터와 반환 타입을 직접 완성하라.
   *   - "T에 실제로 존재하는 키만" 받아야 한다 (존재하지 않는 키는 컴파일 에러가 나야 한다).
   *   - 반환은 "그 키가 가리키는 값의 타입 배열"이어야 한다 (string으로 뭉개지면 안 된다).
   */
  field<K extends keyof T>(key: K): T[K][] {
    throw new Error('TODO: field 를 구현하세요');
  }

  /**
   * 각 이벤트를 keys에 해당하는 프로퍼티만 남긴 부분 객체로 사영해 배열로 반환한다.
   *   예: summaryOf(['at', 'userId']) → [{ at, userId }, ...]
   */
  summaryOf<K extends keyof T>(keys: K[]): Pick<T, K>[] {
    throw new Error('TODO: summaryOf 를 구현하세요');
  }

  /**
   * 마지막 이벤트를 patch로 부분 갱신한다.
   *   - 비어 있으면 undefined.
   *   - 있으면 마지막 이벤트를 patch로 덮어써 갱신하고, 갱신된 이벤트를 반환.
   *   - at 은 patch로 바꿀 수 없어야 한다(계약상 시각은 불변).
   *
   * ★ [SIGNATURE] 이 메서드의 patch 파라미터 타입을 직접 완성하라.
   *   - "at을 제외한 나머지를 부분적으로만" 받아야 한다 (at을 넣으면 컴파일 에러가 나야 한다).
   *   - 반환 타입은 T | undefined.
   */
  amend(patch: Partial<Omit<T, 'at'>>): T | undefined {
    throw new Error('TODO: amend 를 구현하세요');
  }
}
