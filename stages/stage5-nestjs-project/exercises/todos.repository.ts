// Repository 계층 — "데이터를 어디에/어떻게 저장하는가"를 캡슐화한다.
//
// 핵심: 인터페이스(TodoRepository)로 저장소를 추상화한다.
// 서비스는 인터페이스에만 의존하므로, 인메모리든 DB든 구현을 갈아끼울 수 있다.
// (스테이지 4에서 만든 미니 DI의 "인터페이스 → 구현 바인딩"과 동일한 발상이다.)

import { Todo } from './dto';

// 저장소 계약(인터페이스).
export interface TodoRepository {
  findAll(): Todo[];
  findById(id: number): Todo | undefined;
  create(title: string): Todo;
  update(id: number, patch: { title?: string; completed?: boolean }): Todo | undefined;
  remove(id: number): boolean;
}

// 인터페이스는 런타임에 사라지므로(타입일 뿐), DI 컨테이너가 잡을 수 있는
// "인젝션 토큰"을 문자열로 따로 둔다. 프로바이더 등록/주입 양쪽에서 이 토큰을 쓴다.
export const TODO_REPOSITORY = 'TODO_REPOSITORY';

// 인메모리 구현. Map으로 id → Todo 를 관리한다.
export class InMemoryTodoRepository implements TodoRepository {
  private readonly store = new Map<number, Todo>();
  private nextId = 1;

  findAll(): Todo[] {
    // 힌트: store.values() 를 배열로 펼쳐 반환한다.
    throw new Error('TODO: 모든 Todo를 반환하라');
  }

  findById(id: number): Todo | undefined {
    // 힌트: store.get(id)
    throw new Error('TODO: id로 Todo를 조회하라');
  }

  create(title: string): Todo {
    // 힌트: { id: this.nextId++, title, completed: false } 를 만들어 store에 넣고 반환한다.
    throw new Error('TODO: Todo를 생성해 저장하라');
  }

  update(id: number, patch: { title?: string; completed?: boolean }): Todo | undefined {
    // 힌트: 기존 항목이 없으면 undefined. 있으면 patch에서 undefined가 아닌 필드만 덮어써
    //       새 객체를 만들고 store에 다시 넣은 뒤 반환한다.
    throw new Error('TODO: Todo를 부분 수정하라');
  }

  remove(id: number): boolean {
    // 힌트: store.delete(id) 는 존재 여부를 boolean으로 돌려준다.
    throw new Error('TODO: Todo를 삭제하라');
  }
}
