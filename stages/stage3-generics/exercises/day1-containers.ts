// Day 1 — 제네릭 클래스 기초: 타입 안전 컨테이너
//
// 제네릭 클래스는 "타입을 나중에 채워 넣는 클래스"다.
// 클래스 이름 뒤 <T>로 타입 변수를 선언하면, 내부에서 그 T를 프로퍼티·인자·반환 타입으로 쓸 수 있다.
// 사용하는 쪽에서 new Stack<number>() 처럼 T를 확정하면 그 인스턴스는 number 전용이 된다.
//
// 여기서는 두 가지 고전 자료구조를 제네릭으로 만든다.
//  - Stack<T> : 후입선출(LIFO)
//  - Queue<T> : 선입선출(FIFO)

/** 후입선출(LIFO) 스택. 마지막에 넣은 값이 가장 먼저 나온다. */
export class Stack<T> {
  // 힌트: 내부 저장소는 T[] 배열이면 충분하다. private로 캡슐화한다.
  private items: T[] = [];

  /** 값을 스택 맨 위에 넣는다. */
  push(item: T): void {
    // 힌트: 배열 끝에 붙이면 그게 "맨 위"다.
    this.items.push(item);
  }

  /** 맨 위 값을 꺼내 반환한다. 비어 있으면 undefined. */
  pop(): T | undefined {
    // 힌트: 배열 끝에서 하나 빼는 메서드가 있다.
    return this.items.pop();
  }

  /** 맨 위 값을 꺼내지 않고 들여다본다. 비어 있으면 undefined. */
  peek(): T | undefined {
    // 힌트: 마지막 인덱스는 length - 1 이다.
    return this.items[this.items.length - 1];
  }

  /** 현재 담긴 원소 개수. */
  get size(): number {
    // 힌트: 배열 length를 그대로 노출하면 된다.
    return this.items.length;
  }

  /** 비어 있으면 true. */
  isEmpty(): boolean {
    return this.items.length == 0;
  }
}

/** 선입선출(FIFO) 큐. 먼저 넣은 값이 먼저 나온다. */
export class Queue<T> {
  private items: T[] = [];

  /** 값을 큐 뒤에 넣는다. */
  enqueue(item: T): void {
    // 힌트: 뒤에 붙인다.
    this.items.push(item);
  }

  /** 큐 앞에서 값을 꺼내 반환한다. 비어 있으면 undefined. */
  dequeue(): T | undefined {
    // 힌트: 배열 앞에서 하나 빼는 메서드가 있다(shift).
    return this.items.shift();
  }

  /** 다음에 나올 값(맨 앞)을 들여다본다. 비어 있으면 undefined. */
  front(): T | undefined {
    return this.items[0];
  }

  /** 현재 담긴 원소 개수. */
  get size(): number {
    return this.items.length;
  }

  /** 비어 있으면 true. */
  isEmpty(): boolean {
    return this.items.length == 0;
  }
}
