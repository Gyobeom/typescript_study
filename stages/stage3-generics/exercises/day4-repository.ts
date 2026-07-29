// Day 4 — Repository<T> 패턴
//
// 실무 서버 코드에서 가장 자주 만나는 제네릭 클래스다.
// TypeORM의 Repository<Entity>, NestJS 서비스가 주입받는 저장소가 모두 이 모양이다.
//
// 핵심 아이디어: "id를 가진 엔티티라면 무엇이든" 저장/조회/삭제하는 공통 CRUD를 한 번만 쓴다.
// 그래서 제약이 `T extends { id: string }` 이다 — id로 식별할 수 있는 타입만 받는다.
//
// 이번 구현은 실제 DB 대신 메모리(Map)에 저장하는 인메모리 리포지토리다.

/** id로 식별 가능한 엔티티의 최소 계약. */
export interface Entity {
  id: string;
}

/**
 * { id: string } 을 만족하는 엔티티를 메모리에 저장하는 제네릭 리포지토리.
 * TypeORM Repository<T> 의 축소판이라고 생각하면 된다.
 */
export class InMemoryRepository<T extends Entity> {
  // 힌트: id(string) → 엔티티(T) 매핑에는 Map<string, T> 가 자연스럽다.
  private store = new Map<string, T>();

  /**
   * 엔티티를 저장한다(같은 id면 덮어쓰기 = upsert).
   * 저장한 엔티티를 그대로 반환한다.
   */
  save(entity: T): T {
    // 힌트: store.set(entity.id, entity) 후 entity를 반환한다.
    throw new Error('TODO: save 를 구현하세요');
  }

  /** id로 하나 찾는다. 없으면 undefined. */
  findById(id: string): T | undefined {
    // 힌트: Map.get 이 없으면 undefined를 준다.
    throw new Error('TODO: findById 를 구현하세요');
  }

  /** 저장된 모든 엔티티를 배열로 반환한다(내부 저장소 노출 금지). */
  findAll(): T[] {
    // 힌트: [...store.values()] 로 사본 배열을 만든다.
    throw new Error('TODO: findAll 을 구현하세요');
  }

  /**
   * id로 삭제한다.
   * 실제로 지웠으면 true, 대상이 없었으면 false를 반환한다.
   */
  delete(id: string): boolean {
    // 힌트: Map.delete 의 반환값이 그대로 "지웠는지 여부"다.
    throw new Error('TODO: delete 를 구현하세요');
  }

  /** 저장된 엔티티 개수. */
  count(): number {
    // 힌트: Map.size.
    throw new Error('TODO: count 를 구현하세요');
  }
}
