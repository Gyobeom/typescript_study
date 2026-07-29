# 스테이지 3 — 제네릭 클래스 (3주차)

> **학습 목표**: 제네릭 클래스와 제약(`extends`)으로 재사용 가능한 컴포넌트를 만든다.
> 실무 표준 패턴인 `Repository<T>`를 직접 구현하고, 유틸리티 타입(`Partial`, `Pick`, `Omit`)까지 클래스와 결합한다.

---

## 1. 개념: 제네릭이란

제네릭은 **"타입을 나중에 채워 넣는" 문법**이다. 값이 파라미터로 함수에 들어가듯, **타입이 파라미터로 클래스/함수에 들어간다.**

### 왜 필요한가 — `any`와의 차이

`any`를 쓰면 타입 검사가 꺼진다. 넣을 때도, 꺼낼 때도 아무 타입이나 통과한다.

```ts
class AnyBox {
  private value: any;
  set(v: any) { this.value = v; }
  get(): any { return this.value; }
}

const box = new AnyBox();
box.set(123);
const s: string = box.get(); // 컴파일 통과! 하지만 런타임에 number가 들어있다 → 버그
```

제네릭은 **"넣은 타입 그대로 꺼내게"** 강제한다.

```ts
class Box<T> {
  private value!: T;
  set(v: T) { this.value = v; }
  get(): T { return this.value; }
}

const box = new Box<number>();
box.set(123);
const s: string = box.get(); // ❌ 컴파일 에러 — number를 string에 넣을 수 없다
const n: number = box.get(); // ✅
```

`new Box<number>()`로 `T`를 `number`로 확정하는 순간, 이 인스턴스는 number 전용 상자가 된다. **타입 안전성은 지키면서 코드는 한 번만 쓴다.**

### 제네릭 제약 — `T extends ...`

`T`는 기본적으로 무엇이든 될 수 있어서, `T`의 프로퍼티에 함부로 접근하지 못한다.
`extends`로 "이런 모양을 반드시 가진다"고 좁히면 그때부터 접근할 수 있다.

```ts
// { length: number } 를 가진 타입만 받는다 → string, 배열 등
function totalLength<T extends { length: number }>(items: T[]): number {
  return items.reduce((sum, x) => sum + x.length, 0);
}
```

### `keyof` — 그 객체에 실제로 있는 키만

```ts
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { id: 1, name: 'kim' };
pluck(user, 'name'); // ✅ string
pluck(user, 'email'); // ❌ 'email'은 user의 키가 아니다
```

### 유틸리티 타입 (Day 5)

TypeScript가 기본 제공하는 타입 변형기다. 제네릭 클래스와 함께 쓰면 실무 코드가 짧고 안전해진다.

| 유틸리티 | 의미 | 대표 용도 |
|---|---|---|
| `Partial<T>` | 모든 프로퍼티를 선택적으로 | 부분 업데이트 `update(id, dto: Partial<T>)` |
| `Pick<T, K>` | K 키만 골라낸 타입 | 응답 DTO에서 일부 필드만 노출 |
| `Omit<T, K>` | K 키를 뺀 타입 | 생성 DTO에서 `id` 제외 |

---

## 2. 채용 연관성 — 왜 이걸 반드시 익혀야 하나

제네릭 클래스는 "있으면 좋은" 게 아니라 **Node.js/TypeScript 서버 코드를 읽기 위한 전제 지식**이다.

- **TypeORM**: `Repository<Entity>`가 곧 제네릭 클래스다. `userRepository.findOne(...)`, `save(...)`를 쓰는 순간 이미 제네릭을 쓰고 있는 것이다. Day 4의 `InMemoryRepository<T>`가 그 축소판이다.
- **NestJS**: 서비스가 리포지토리를 주입받아 CRUD를 위임하는 구조가 표준이다. `constructor(private repo: Repository<User>)` 를 이해하려면 `Repository<T>` 패턴이 손에 있어야 한다.
- **update DTO**: `update(id: string, dto: Partial<User>)`는 실무에서 관용구 수준으로 등장한다. Day 5가 정확히 이 모양이다.

> 즉 이번 주는 "TypeORM/NestJS 코드를 남의 것이 아니라 **내가 만들 수 있는 것**으로 만드는" 주다.

---

## 3. 일차별 문제 안내

| 일차 | 파일 | 주제 | 핵심 |
|---|---|---|---|
| Day 1 | `day1-containers.ts` | 제네릭 클래스 기초 | `Stack<T>`, `Queue<T>` — 타입 안전 컨테이너 (LIFO/FIFO) |
| Day 2 | `day2-constraints.ts` | 제약 + `keyof` | `LengthTracker<T extends {length}>`, `PropertyPicker<T>.pluck<K extends keyof T>` |
| Day 3 | `day3-comparable.ts` | 제네릭 + 인터페이스 | `Comparable<T>`를 구현한 것만 담는 `SortedCollection<T extends Comparable<T>>` |
| Day 4 | `day4-repository.ts` | **Repository 패턴** | `{ id: string }` 제약의 `InMemoryRepository<T>` (save/findById/findAll/delete) |
| Day 5 | `day5-utility-repository.ts` | 유틸리티 타입 종합 | `update(id, Partial<Omit<T,'id'>>)`, `findWhere(Partial<T>)` — **일부 시그니처도 직접 작성** |

> **Day 5 주의**: 다른 날과 달리 메서드 **시그니처(파라미터·반환 타입)도 직접 채우는** TODO가 있다. 파일 안 `★ TODO(SIGNATURE)` 주석을 따라가라.

각 파일은 strict 모드에서 **컴파일은 되지만** 본문이 `throw new Error('TODO: ...')`로 비어 있다. 여러분이 채워 테스트를 통과시킨다. 타입 레벨 검증에는 `@ts-expect-error`가 쓰였다 — 잘못된 타입 사용이 **컴파일 단계에서 막히는지**까지 확인한다.

---

## 4. 진행 방법

```bash
# 1) 내 구현(exercises) 대상으로 채점 — 처음엔 다 실패(빨강)한다
npm run check:stage3

# 2) 오늘 파일의 TODO를 구현한다 → 초록이 될 때까지 반복

# 3) 20분 이상 막히면 모범 답안과 비교
#    stages/stage3-generics/solutions/<같은파일명>.ts

# 4) 답안이 테스트를 실제로 통과하는지 확인하고 싶다면
npm run check:stage3:answer   # TARGET=solutions 로 동일 테스트 실행 → 전체 통과

# 5) 전체 타입 체크(strict)
npm run typecheck
```

**막혔을 때 원칙**: 답안을 통째로 베끼지 말고, **비교하며 이해한 뒤 덮고 다시 스스로** 작성한다.
테스트는 `@stage3/<모듈명>` 경로로 import하며, `TARGET` 환경변수에 따라 **같은 테스트가 exercises/solutions 양쪽을 대상으로** 돈다.

**완료 기준**: `npm run check:stage3` 전체 통과 + `PROGRESS.md` 체크.
