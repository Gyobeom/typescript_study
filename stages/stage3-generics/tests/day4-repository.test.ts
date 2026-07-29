import { InMemoryRepository, Entity } from '@stage3/day4-repository';

interface User extends Entity {
  id: string;
  name: string;
}

describe('Day 4 — InMemoryRepository<T extends { id: string }>', () => {
  it('save한 엔티티를 findById로 되찾는다', () => {
    const repo = new InMemoryRepository<User>();
    const saved = repo.save({ id: 'u1', name: 'kim' });
    expect(saved).toEqual({ id: 'u1', name: 'kim' });
    expect(repo.findById('u1')).toEqual({ id: 'u1', name: 'kim' });
  });

  it('같은 id로 save하면 덮어쓴다(upsert)', () => {
    const repo = new InMemoryRepository<User>();
    repo.save({ id: 'u1', name: 'kim' });
    repo.save({ id: 'u1', name: 'lee' });
    expect(repo.count()).toBe(1);
    expect(repo.findById('u1')?.name).toBe('lee');
  });

  it('findAll은 저장된 모든 엔티티를 반환한다', () => {
    const repo = new InMemoryRepository<User>();
    repo.save({ id: 'u1', name: 'a' });
    repo.save({ id: 'u2', name: 'b' });
    expect(repo.findAll()).toHaveLength(2);
  });

  it('delete는 대상이 있으면 true, 없으면 false', () => {
    const repo = new InMemoryRepository<User>();
    repo.save({ id: 'u1', name: 'a' });
    expect(repo.delete('u1')).toBe(true);
    expect(repo.delete('u1')).toBe(false);
    expect(repo.findById('u1')).toBeUndefined();
    expect(repo.count()).toBe(0);
  });

  it('없는 id 조회는 undefined', () => {
    const repo = new InMemoryRepository<User>();
    expect(repo.findById('nope')).toBeUndefined();
  });

  it('타입 레벨: id 없는 타입은 리포지토리 인자로 거부된다', () => {
    // @ts-expect-error { id: string } 제약을 만족하지 않는다
    const bad: InMemoryRepository<{ name: string }> = new InMemoryRepository();
    expect(bad).toBeDefined();
  });
});
