import { UpdatableRepository, Entity } from '@stage3/day5-utility-repository';

interface Product extends Entity {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

function seed(): UpdatableRepository<Product> {
  const repo = new UpdatableRepository<Product>();
  repo.save({ id: 'p1', name: 'apple', price: 100, active: true });
  repo.save({ id: 'p2', name: 'banana', price: 200, active: false });
  repo.save({ id: 'p3', name: 'cherry', price: 100, active: true });
  return repo;
}

describe('Day 5 — UpdatableRepository.update(id, Partial<Omit<T, "id">>)', () => {
  it('부분 갱신: 일부 프로퍼티만 바꾸고 나머지는 보존한다', () => {
    const repo = seed();
    const updated = repo.update('p1', { price: 150 });
    expect(updated).toEqual({
      id: 'p1',
      name: 'apple',
      price: 150,
      active: true,
    });
  });

  it('없는 id를 update하면 undefined', () => {
    const repo = seed();
    expect(repo.update('nope', { price: 1 })).toBeUndefined();
  });

  it('여러 프로퍼티를 한 번에 갱신한다', () => {
    const repo = seed();
    const updated = repo.update('p2', { name: 'BANANA', active: true });
    expect(updated?.name).toBe('BANANA');
    expect(updated?.active).toBe(true);
    expect(updated?.price).toBe(200); // 안 바꾼 값 보존
  });

  it('타입 레벨: update로 id는 바꿀 수 없다', () => {
    const repo = seed();
    // @ts-expect-error id는 Omit으로 제외되어 patch에 넣을 수 없다
    repo.update('p1', { id: 'changed' });
    expect(repo.findById('p1')).toBeDefined();
  });
});

describe('Day 5 — UpdatableRepository.findWhere(Partial<T>)', () => {
  it('단일 조건으로 필터링한다', () => {
    const repo = seed();
    const result = repo.findWhere({ price: 100 });
    expect(result.map((p) => p.id).sort()).toEqual(['p1', 'p3']);
  });

  it('복합 조건은 모두 만족해야 한다', () => {
    const repo = seed();
    const result = repo.findWhere({ price: 100, active: true });
    expect(result).toHaveLength(2);
  });

  it('일치하는 게 없으면 빈 배열', () => {
    const repo = seed();
    expect(repo.findWhere({ price: 999 })).toEqual([]);
  });
});
