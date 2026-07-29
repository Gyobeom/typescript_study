// Day 5 — 종합: 유틸리티 타입 + 제네릭 클래스 (모범 답안)

/** id로 식별 가능한 엔티티의 최소 계약. */
export interface Entity {
  id: string;
}

/** 부분 업데이트를 지원하는 제네릭 리포지토리. */
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

  update(id: string, patch: Partial<Omit<T, 'id'>>): T | undefined {
    const existing = this.store.get(id);
    if (existing === undefined) return undefined;
    const updated = { ...existing, ...patch, id: existing.id } as T;
    this.store.set(id, updated);
    return updated;
  }

  findWhere(criteria: Partial<T>): T[] {
    const keys = Object.keys(criteria) as (keyof T)[];
    return this.findAll().filter((entity) =>
      keys.every((key) => entity[key] === criteria[key]),
    );
  }

  count(): number {
    return this.store.size;
  }
}
