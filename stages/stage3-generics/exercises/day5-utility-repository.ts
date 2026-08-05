// Day 5 — 종합: 유틸리티 타입 + 제네릭 클래스
//
// Day 4의 리포지토리를 확장해, TypeScript 내장 유틸리티 타입과 결합한다.
//  - Partial<T> : T의 모든 프로퍼티를 선택적으로 만든 타입 → 부분 업데이트(update)에 딱 맞다.
//  - Pick<T, K> : T에서 K 키들만 골라낸 타입.
//  - Omit<T, K> : T에서 K 키들을 뺀 타입.
//
// 실무에서 update(id, dto: Partial<Entity>) 시그니처는 거의 관용구 수준으로 등장한다.
//
// ★ 오늘은 일부 "시그니처"도 직접 작성한다. 아래 TODO(SIGNATURE) 주석을 보고
//   메서드 선언부(파라미터·반환 타입)까지 스스로 채워라. 본문은 그 다음이다.

import { create } from "domain";

/** id로 식별 가능한 엔티티의 최소 계약. */
export interface Entity {
  id: string;
}

/**
 * 부분 업데이트(update)를 지원하는 제네릭 리포지토리.
 * Day 4의 CRUD에 update / findWhere 를 더한 종합판이다.
 */
export class UpdatableRepository<T extends Entity> {
  private store = new Map<string, T>();

  save(entity: T): T {
    this.store.set(entity.id, entity);
    return entity;
  }

  findById(id: string): T | undefined {
    return this.store.get(id);
  }

  findAll(): T[] {
    return [...this.store.values()];
  }

  /**
   * id에 해당하는 엔티티를 patch로 부분 갱신한다.
   * - 대상이 없으면 undefined 반환.
   * - 있으면 기존 값에 patch를 덮어써 갱신하고, 갱신된 엔티티를 반환한다.
   * - id는 patch로 바꿀 수 없어야 한다(계약상 식별자는 불변).
   *
   * ★ TODO(SIGNATURE): 아래 메서드의 파라미터/반환 타입을 직접 완성하라.
   *   - 두 번째 파라미터는 "id를 제외한 나머지를 부분적으로" 받아야 한다.
   *     힌트: Partial<Omit<T, 'id'>>
   *   - 반환 타입은 T | undefined.
   */
  update(id: string, patch: Partial<Omit<T, 'id'>>): T | undefined {
    // 힌트:
    //   1) findById로 기존 엔티티를 찾는다. 없으면 undefined.
    //   2) { ...existing, ...patch, id: existing.id } 로 병합해 id를 지킨다.
    //   3) save로 다시 저장하고 반환한다.
    const existing = this.findById(id);
    if (existing) {
      const updatedStore = { ...existing, ...patch, id: existing.id }
      return this.save(updatedStore)
    } else
      return existing
  }

  /**
   * 주어진 부분 조건과 일치하는 엔티티만 필터링해 반환한다.
   * predicate 대신 "부분 일치(shallow match)"로 찾는다.
   *
   * ★ TODO(SIGNATURE): 파라미터 criteria 의 타입을 직접 채워라.
   *   힌트: Partial<T> (일부 프로퍼티만 조건으로 넘길 수 있어야 한다)
   */
  findWhere(criteria: Partial<T>): T[] {
    // 힌트:
    //   findAll()을 돌며, criteria의 모든 키에 대해 entity[key] === criteria[key] 인 것만 남긴다.
    //   Object.keys(criteria) 를 (keyof T)[] 로 단언해 순회하면 편하다.
    const keys = Object.keys(criteria) as (keyof T)[];

    return this.findAll().filter(entity => keys.every(key => entity[key] === criteria[key]))
  }

  count(): number {
    return this.store.size;
  }
}
