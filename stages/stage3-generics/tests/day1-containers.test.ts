import { Stack, Queue } from '@stage3/day1-containers';

describe('Day 1 — Stack<T>', () => {
  it('LIFO 순서로 push/pop 한다', () => {
    const stack = new Stack<number>();
    stack.push(1);
    stack.push(2);
    stack.push(3);
    expect(stack.pop()).toBe(3);
    expect(stack.pop()).toBe(2);
    expect(stack.pop()).toBe(1);
  });

  it('peek는 값을 꺼내지 않고 들여다본다', () => {
    const stack = new Stack<string>();
    stack.push('a');
    stack.push('b');
    expect(stack.peek()).toBe('b');
    expect(stack.size).toBe(2); // peek 후에도 크기 유지
  });

  it('빈 스택에서 pop/peek는 undefined, isEmpty는 true', () => {
    const stack = new Stack<number>();
    expect(stack.isEmpty()).toBe(true);
    expect(stack.pop()).toBeUndefined();
    expect(stack.peek()).toBeUndefined();
    stack.push(10);
    expect(stack.isEmpty()).toBe(false);
  });
});

describe('Day 1 — Queue<T>', () => {
  it('FIFO 순서로 enqueue/dequeue 한다', () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);
    expect(queue.dequeue()).toBe(1);
    expect(queue.dequeue()).toBe(2);
    expect(queue.dequeue()).toBe(3);
  });

  it('front는 다음에 나올 값을 꺼내지 않고 본다', () => {
    const queue = new Queue<string>();
    queue.enqueue('first');
    queue.enqueue('second');
    expect(queue.front()).toBe('first');
    expect(queue.size).toBe(2);
  });

  it('빈 큐에서 dequeue/front는 undefined, isEmpty는 true', () => {
    const queue = new Queue<number>();
    expect(queue.isEmpty()).toBe(true);
    expect(queue.dequeue()).toBeUndefined();
    expect(queue.front()).toBeUndefined();
  });
});
