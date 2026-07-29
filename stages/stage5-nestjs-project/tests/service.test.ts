// 단위 테스트 — Service 계층 (TestingModule로 DI 조립)
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TodosService } from '@stage5/todos.service';
import {
  TODO_REPOSITORY,
  InMemoryTodoRepository,
} from '@stage5/todos.repository';

describe('Day 2 — TodosService (DI)', () => {
  let service: TodosService;

  beforeEach(async () => {
    // 스테이지 4의 미니 DI와 같은 개념: 토큰 → 구현 바인딩을 등록하고
    // 컨테이너가 생성자 주입을 해결하게 한다.
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: TODO_REPOSITORY, useClass: InMemoryTodoRepository },
      ],
    }).compile();

    service = moduleRef.get(TodosService);
  });

  it('생성자 주입으로 저장소가 결선되어 create/findAll 이 동작한다', () => {
    expect(service.findAll()).toEqual([]);
    const t = service.create('learn nest');
    expect(t.title).toBe('learn nest');
    expect(service.findAll()).toHaveLength(1);
  });

  it('findOne 은 없는 id에 NotFoundException 을 던진다', () => {
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });

  it('update 는 값을 바꾸고, 없는 id면 NotFoundException', () => {
    const t = service.create('a');
    const updated = service.update(t.id, { completed: true });
    expect(updated.completed).toBe(true);
    expect(() => service.update(999, { title: 'x' })).toThrow(NotFoundException);
  });

  it('remove 는 삭제하고, 없는 id면 NotFoundException', () => {
    const t = service.create('a');
    service.remove(t.id);
    expect(service.findAll()).toEqual([]);
    expect(() => service.remove(t.id)).toThrow(NotFoundException);
  });
});
