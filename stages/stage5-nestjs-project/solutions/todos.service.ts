// Service 계층 — 비즈니스 로직을 담당한다.
//
// 컨트롤러(HTTP)와 저장소(데이터) 사이에서 "규칙"을 적용한다.
// 여기서는 @Injectable + 생성자 주입으로 저장소를 받는다.
// @Inject(TODO_REPOSITORY): 인터페이스 타입은 런타임에 없으므로 토큰으로 명시 주입한다.
// (스테이지 4의 미니 DI와 같은 원리 — 생성자 파라미터를 컨테이너가 채워준다.)

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Todo } from './dto';
import { TodoRepository, TODO_REPOSITORY } from './todos.repository';

@Injectable()
export class TodosService {
  constructor(
    @Inject(TODO_REPOSITORY) private readonly repo: TodoRepository,
  ) {}

  findAll(): Todo[] {
    return this.repo.findAll();
  }

  findOne(id: number): Todo {
    const todo = this.repo.findById(id);
    if (!todo) {
      // 없는 id를 조회하면 404. NestJS가 이 예외를 HTTP 404로 자동 변환한다.
      throw new NotFoundException(`Todo #${id} not found`);
    }
    return todo;
  }

  create(title: string): Todo {
    return this.repo.create(title);
  }

  update(id: number, patch: { title?: string; completed?: boolean }): Todo {
    const updated = this.repo.update(id, patch);
    if (!updated) {
      throw new NotFoundException(`Todo #${id} not found`);
    }
    return updated;
  }

  remove(id: number): void {
    const ok = this.repo.remove(id);
    if (!ok) {
      throw new NotFoundException(`Todo #${id} not found`);
    }
  }
}
