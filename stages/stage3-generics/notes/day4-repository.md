# Day 4 — Repository&lt;T&gt; 패턴: 실무 제네릭의 핵심

> 실습 전 30분 이론. 오늘 실습은 `InMemoryRepository<T extends { id: string }>`(save/findById/findAll/delete/count)다.
> 이 노트는 실습과 다른 도메인(도서 카탈로그)으로 리포지토리 패턴의 뼈대를 익힌다.

---

## 오늘의 학습 목표

1. **Repository 패턴**이 무엇이며 왜 실무 서버 코드에 항상 등장하는지 안다.
2. `T extends { id: string }` 제약이 왜 리포지토리의 전제인지 설명할 수 있다.
3. `Map<string, T>`로 인메모리 저장소를 구성하는 이유를 안다.
4. CRUD 각 메서드의 **반환 타입 설계**(`T | undefined`, `boolean`)를 근거로 설명한다.
5. TypeORM `Repository<Entity>`가 오늘 만드는 것의 확장판임을 연결한다.

---

## 1. Repository 패턴이란

Repository는 **"데이터 저장소를 컬렉션처럼 다루게 해주는 객체"** 다. 애플리케이션 코드는 "SQL을 어떻게 짜는지"를 모르고, 그저 `save`, `findById`, `delete` 같은 **의미 있는 메서드**만 호출한다.

```ts
// 서비스는 저장 방식(DB? 메모리? 파일?)을 모른 채 CRUD만 위임한다
class BookService {
  constructor(private books: Repository<Book>) {}
  register(book: Book) { return this.books.save(book); }
  find(id: string) { return this.books.findById(id); }
}
```

핵심 이득: **저장 로직과 비즈니스 로직의 분리.** 저장소 구현이 메모리든 PostgreSQL이든 서비스 코드는 바뀌지 않는다.

그런데 엔티티 타입마다(`Book`, `Author`, `Order`...) 리포지토리를 복붙하면 낭비다. 그래서 **제네릭**으로 한 번만 쓴다 — 그게 오늘의 주제다.

---

## 2. 왜 `T extends { id: string }` 인가

리포지토리의 모든 조작은 **식별자(id)** 를 중심으로 돈다. `findById(id)`, `delete(id)`, "같은 id면 덮어쓰기". 즉 `T`가 무엇이든 **id로 식별 가능**해야 한다.

```ts
interface Identifiable {
  id: string;
}

class Repo<T extends Identifiable> {
  save(entity: T) { /* entity.id 로 저장 */ }
}
```

제약이 없다면 `save` 본문에서 `entity.id`에 접근할 때 이런 에러가 난다.

```
Property 'id' does not exist on type 'T'.
```

제약 `T extends Identifiable`이 **"이 T는 반드시 id를 가진다"** 를 보장해, `entity.id`를 합법으로 만든다. Day 2~3에서 반복한 "제약 = 접근 권한" 원리가 여기서도 그대로다.

id 없는 타입을 넣으면 인스턴스화 단계에서 막힌다.

```ts
new Repo<{ title: string }>(); // ❌ Property 'id' is missing → 제약 위반
```

---

## 3. 왜 `Map<string, T>` 인가

인메모리 저장소의 자료구조로 배열도 가능하지만 `Map`이 자연스럽다.

| 연산 | 배열 `T[]` | `Map<string, T>` |
|---|---|---|
| id로 조회 | `find(x => x.id === id)` — O(n) | `map.get(id)` — O(1) |
| id로 삭제 | 인덱스 찾아 splice — O(n) | `map.delete(id)` — O(1) |
| upsert(덮어쓰기) | 존재 검사 후 교체 — 번거로움 | `map.set(id, e)` — 알아서 덮어씀 |
| 개수 | `arr.length` | `map.size` |

`Map`의 키를 `id`로 삼으면 조회/삭제/덮어쓰기가 전부 한 줄로 끝난다. **id 기반 저장소엔 Map이 정석**이다.

```ts
const store = new Map<string, Book>();
store.set('b1', book);        // 저장 (같은 키면 upsert)
store.get('b1');              // 조회 → Book | undefined
store.delete('b1');           // 삭제 → 지웠으면 true
store.size;                   // 개수
[...store.values()];          // 전체를 배열로
```

---

## 4. 반환 타입 설계 — 왜 이렇게 생겼나

리포지토리 메서드의 반환 타입은 **"실패/부재를 어떻게 표현하는가"** 로 정해진다.

| 메서드 | 반환 타입 | 이유 |
|---|---|---|
| `save(entity): T` | `T` | 저장은 항상 성공, 저장한 걸 그대로 돌려줌(체이닝 편의) |
| `findById(id): T \| undefined` | `T \| undefined` | 없을 수 있으니 부재를 `undefined`로 표현 |
| `findAll(): T[]` | `T[]` | 없으면 빈 배열. `undefined` 아님 |
| `delete(id): boolean` | `boolean` | 실제로 지웠으면 `true`, 대상 없었으면 `false` |
| `count(): number` | `number` | 개수 |

`findById`가 `T`가 아니라 `T | undefined`인 게 핵심이다. "없을 수 있다"를 타입에 담아, 호출자가 **부재를 반드시 처리하게** 강제한다(Day 1의 `pop()` 함정과 같은 발상).

`Map.get`이 이미 `T | undefined`를 반환하고, `Map.delete`가 이미 `boolean`을 반환한다 — 표준 API의 반환 타입이 우리가 원하는 계약과 정확히 맞는다.

### 전체를 한눈에 — 도서 카탈로그 예시

지금까지의 조각을 하나로 모으면 이런 모양이다(오늘 실습과 도메인이 다르다).

```ts
interface Book extends Identifiable {
  id: string;
  title: string;
}

const shelf = new Repo<Book>();
shelf.save({ id: 'b1', title: 'Clean Code' });
shelf.save({ id: 'b1', title: 'Clean Code 2e' }); // 같은 id → 덮어쓰기(upsert)

shelf.findById('b1');      // { id: 'b1', title: 'Clean Code 2e' }
shelf.findById('nope');    // undefined  ← 부재를 타입으로 표현
shelf.delete('b1');        // true  (실제로 지움)
shelf.delete('b1');        // false (이미 없음)
```

같은 `Repo<T>` 클래스가 `Repo<Book>`, `Repo<Author>`, `Repo<Order>` 무엇이든 될 수 있다. **로직은 한 번, 타입은 인스턴스마다** — Day 1에서 배운 제네릭의 이득이 리포지토리에서 극대화된다.

---

## 5. 실무·채용 연결

- **TypeORM `Repository<Entity>`**: `userRepo.findOne({ where: { id } })`, `userRepo.save(user)`가 오늘 만드는 것의 실제 버전이다. 메서드 이름과 시그니처가 놀랄 만큼 비슷하다. 오늘 `InMemoryRepository<T>`를 손으로 짜본 사람은 TypeORM 코드를 "남의 마법"이 아니라 "내가 아는 패턴"으로 읽는다.
- **NestJS 의존성 주입**: `constructor(@InjectRepository(User) private repo: Repository<User>)`를 이해하려면 `Repository<T>`가 제네릭 클래스임을 알아야 한다.
- **테스트 더블**: 실제 DB 대신 인메모리 리포지토리를 주입해 단위 테스트하는 건 표준 기법이다. 오늘 만드는 게 바로 그 "가짜 저장소"의 원형이다.
- **면접 단골**: "Repository 패턴이 뭐고 왜 쓰나?" → "저장 로직과 도메인 로직을 분리하고, 저장소를 교체 가능하게 만든다"가 정답. 제네릭으로 엔티티별 중복을 없앤다는 점까지 말하면 완성.

---

## 6. 흔한 실수와 함정

1. **`save`가 아무것도 반환 안 함(`void`).** 관례상 저장한 엔티티를 돌려주면 `const saved = repo.save(x)` 체이닝이 된다. 실무 리포지토리 대부분 그렇다.
2. **`findAll`이 내부 저장소를 그대로 노출.** `[...store.values()]`로 **사본**을 줘야 한다. `store`를 직접 반환하면 호출자가 내부를 오염시킬 수 있다(Day 1·3에서 반복된 함정).
3. **`delete`의 반환값을 항상 `true`로.** "대상이 없었으면 `false`"라는 계약을 지키려면 `Map.delete`의 반환값을 그대로 써야 한다. 임의로 `true`를 주면 "지웠다"는 거짓 신호가 된다.
4. **`findById`를 `T`로 선언하고 `!`로 우기기.** 없을 수 있는데 `T`로 두면 호출자가 부재를 처리하지 않는다. `T | undefined`가 정직한 타입이다.

---

## 7. 오늘 실습과의 연결 (힌트 수준)

- `InMemoryRepository<T extends Entity>`의 `Entity`는 `{ id: string }`이다. 2절 그대로다 — 제약 덕에 `entity.id`에 접근할 수 있다.
- 내부는 이미 `Map<string, T>`로 준비돼 있다. 각 메서드는 3절의 `Map` API 한두 줄이면 대부분 끝난다.
- `save`는 upsert(같은 id면 덮어쓰기) — `Map.set`이 알아서 해준다. 저장 후 엔티티를 반환한다.
- `findAll`은 사본 배열을(6번 함정 2번), `delete`는 `Map.delete`의 반환값을 그대로(함정 3번), `count`는 `Map.size`를 비춘다.

> 각 메서드가 4절 표의 어느 반환 타입에 해당하는지 먼저 확인하고 손대라. 반환 타입이 구현 방향을 알려준다.

---

## 8. 셀프 체크

1. Repository 패턴의 핵심 이득 한 문장은? (저장 로직과 __ 의 분리)
2. `T extends { id: string }` 제약을 빼면 `save` 본문에서 어떤 에러가 나는가?
3. id 기반 저장소에 배열 대신 `Map<string, T>`를 쓰면 조회/삭제가 왜 유리한가?
4. `findById`의 반환 타입이 `T`가 아니라 `T | undefined`여야 하는 이유는?
5. `delete`가 `boolean`을 반환하는 계약에서, `Map.delete`의 반환값을 그대로 쓰면 왜 계약이 맞는가?
