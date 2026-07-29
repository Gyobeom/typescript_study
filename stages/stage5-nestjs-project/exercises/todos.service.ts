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
  // 힌트: 생성자 파라미터에 @Inject(TODO_REPOSITORY) 를 달고
  //       private readonly repo: TodoRepository 로 저장소를 주입받는다.
  constructor(
    @Inject(TODO_REPOSITORY) private readonly repo: TodoRepository,
  ) {}

  findAll(): Todo[] {
    // 힌트: repo.findAll()
    throw new Error('TODO: 모든 Todo를 반환하라');
  }

  findOne(id: number): Todo {
    // 힌트: repo.findById(id) 가 undefined면 NotFoundException(`Todo #${id} not found`) 을 던진다.
    throw new Error('TODO: id로 Todo를 조회하고, 없으면 NotFoundException을 던져라');
  }

  create(title: string): Todo {
    // 힌트: repo.create(title)
    throw new Error('TODO: Todo를 생성하라');
  }

  update(id: number, patch: { title?: string; completed?: boolean }): Todo {
    // 힌트: repo.update(id, patch) 결과가 undefined면 NotFoundException.
    throw new Error('TODO: Todo를 수정하고, 없으면 NotFoundException을 던져라');
  }

  remove(id: number): void {
    // 힌트: repo.remove(id) 가 false면 NotFoundException.
    throw new Error('TODO: Todo를 삭제하고, 없으면 NotFoundException을 던져라');
  }
}
