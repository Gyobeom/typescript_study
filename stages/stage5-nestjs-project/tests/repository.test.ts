// 단위 테스트 — Repository 계층 (NestJS 없이 직접 인스턴스화)
import 'reflect-metadata';
import {
  InMemoryTodoRepository,
  TodoRepository,
} from '@stage5/todos.repository';

describe('Day 3 — InMemoryTodoRepository', () => {
  let repo: TodoRepository;

  beforeEach(() => {
    repo = new InMemoryTodoRepository();
  });

  it('처음에는 빈 목록이다', () => {
    expect(repo.findAll()).toEqual([]);
  });

  it('create 는 id를 1부터 증가시키며 completed=false 로 만든다', () => {
    const a = repo.create('first');
    const b = repo.create('second');
    expect(a).toEqual({ id: 1, title: 'first', completed: false });
    expect(b).toEqual({ id: 2, title: 'second', completed: false });
    expect(repo.findAll()).toHaveLength(2);
  });

  it('findById 로 단건 조회, 없으면 undefined', () => {
    const a = repo.create('x');
    expect(repo.findById(a.id)).toEqual(a);
    expect(repo.findById(999)).toBeUndefined();
  });

  it('update 는 지정 필드만 덮어쓴다', () => {
    const a = repo.create('x');
    const updated = repo.update(a.id, { completed: true });
    expect(updated).toEqual({ id: a.id, title: 'x', completed: true });
    // title은 그대로
    expect(repo.findById(a.id)?.title).toBe('x');
  });

  it('없는 id update 는 undefined', () => {
    expect(repo.update(123, { title: 'nope' })).toBeUndefined();
  });

  it('remove 는 존재 여부를 boolean 으로 반환한다', () => {
    const a = repo.create('x');
    expect(repo.remove(a.id)).toBe(true);
    expect(repo.remove(a.id)).toBe(false);
    expect(repo.findAll()).toEqual([]);
  });
});
