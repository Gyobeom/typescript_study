// Day 4 — Repository<T> 패턴 (모범 답안)

/** id로 식별 가능한 엔티티의 최소 계약. */
export interface Entity {
  id: string;
}

/** { id: string } 엔티티를 메모리에 저장하는 제네릭 리포지토리. */
export class InMemoryRepository<T extends Entity> {
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

  delete(id: string): boolean {
    return this.store.delete(id);
  }

  count(): number {
    return this.store.size;
  }
}
