# Day 5 — 종합: 유틸리티 타입(`Partial`/`Pick`/`Omit`) + 제네릭 리포지토리

> 실습 전 30분 이론. 오늘 실습은 `UpdatableRepository<T>`에 `update`/`findWhere`를 더하는 것이고,
> **일부 메서드 시그니처도 직접 작성**한다(`★ TODO(SIGNATURE)`). 이 노트는 다른 도메인(상품 카탈로그)으로 유틸리티 타입의 원리를 익힌다.

---

## 오늘의 학습 목표

1. `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`가 **기존 타입을 변형하는** 도구임을 이해한다.
2. 각 유틸리티가 내부적으로 어떻게 정의되는지(**원리**) 안다 — 매핑 타입.
3. `Partial<Omit<T, 'id'>>` 같은 **조합**을 읽고 의미를 풀어낼 수 있다.
4. "부분 업데이트 DTO"가 왜 실무 관용구인지, 유틸리티 타입으로 어떻게 표현하는지 안다.
5. 메서드 시그니처(파라미터·반환 타입)를 스스로 설계하는 감각을 갖춘다.

---

## 1. 유틸리티 타입이란 — "타입을 가공하는 함수"

값을 가공하는 함수가 있듯, **타입을 입력받아 새 타입을 만드는** 내장 도구가 유틸리티 타입이다. 원본은 그대로 두고 변형본을 만든다.

기준 타입으로 상품을 쓰자.

```ts
interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}
```

---

## 2. `Partial<T>` — 모든 프로퍼티를 선택적으로

`Partial<T>`는 T의 **모든 프로퍼티에 `?`를 붙인** 타입이다.

```ts
type ProductPatch = Partial<Product>;
// 결과: { id?: string; name?: string; price?: number; inStock?: boolean }

const patch: ProductPatch = { price: 9900 }; // ✅ 일부만 줘도 됨
const empty: ProductPatch = {};              // ✅ 아무것도 안 줘도 됨
```

**원리** — `Partial`은 매핑 타입으로 이렇게 정의돼 있다.

```ts
type Partial<T> = {
  [K in keyof T]?: T[K];
};
```

"T의 모든 키 `K`를 돌며(`in keyof T`), 각 프로퍼티를 선택적(`?`)으로 만들고 값 타입은 `T[K]` 그대로 둔다." Day 2에서 배운 `keyof`와 `T[K]`가 그대로 재등장한다.

**대표 용도**: 부분 업데이트. "이 필드들만 바꿔라"를 `Partial<T>`로 받는다.

---

## 3. `Pick<T, K>` — 고른 키만

`Pick<T, K>`는 T에서 K에 해당하는 키**만** 남긴 타입이다.

```ts
type ProductSummary = Pick<Product, 'id' | 'name'>;
// 결과: { id: string; name: string }
```

**원리**:

```ts
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

"K에 든 키들만 돌며 원래 값 타입으로 만든다." `K extends keyof T` 제약이 있어 존재하지 않는 키는 못 고른다.

**대표 용도**: 응답 DTO. 엔티티에서 노출할 필드만 골라 반환한다(비밀번호 같은 걸 빼고).

---

## 4. `Omit<T, K>` — 뺀 나머지

`Omit<T, K>`는 T에서 K에 해당하는 키를 **제거한** 타입이다. `Pick`의 반대다.

```ts
type NewProduct = Omit<Product, 'id'>;
// 결과: { name: string; price: number; inStock: boolean }  (id 없음)
```

**원리** (Pick과 Exclude의 조합):

```ts
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
```

"T의 모든 키에서 K를 뺀 키들만 `Pick`한다." 즉 `Omit`은 `Pick`의 보수(complement)다.

**대표 용도**: 생성 DTO. `id`는 서버가 부여하니 클라이언트 입력에선 빼야 한다 → `Omit<Product, 'id'>`.

---

## 5. 조합 읽기 — `Partial<Omit<T, 'id'>>`

유틸리티는 **중첩**된다. 안에서 밖으로 읽는다.

```ts
Partial<Omit<Product, 'id'>>
```

1. `Omit<Product, 'id'>` → id를 뺀다 → `{ name; price; inStock }`
2. `Partial<...>` → 남은 걸 전부 선택적으로 → `{ name?; price?; inStock? }`

의미: **"id를 제외한 나머지 필드를, 일부만 골라서 넘길 수 있다."** 정확히 "부분 업데이트에서 식별자는 못 바꾼다"는 계약이다. 이 조합이 실무 `update` 시그니처의 표준형이다.

---

## 6. 시그니처를 스스로 설계하기

오늘은 본문뿐 아니라 **시그니처**도 채운다. 시그니처를 정할 때 스스로 던질 질문:

- **이 파라미터로 뭐가 들어와야 하나?** 전부 필수인가, 일부만인가 → `Partial` 여부.
- **바꾸면 안 되는 필드가 있나?** → `Omit`으로 제외.
- **일부 필드만 받고 싶나?** → `Pick`.
- **없을 수 있는 결과인가?** → 반환 타입에 `| undefined`.

예: "가격만/재고만 갱신할 수 있게, 단 id·이름은 못 바꾸게, 대상 없으면 undefined"

```ts
adjust(id: string, patch: Partial<Pick<Product, 'price' | 'inStock'>>): Product | undefined
//                        └ price·inStock 중 일부만 ────────────┘   └ 없을 수 있음 ┘
```

시그니처가 곧 **계약**이다. 타입만 봐도 "무엇을 받고 무엇을 돌려주는지"가 드러나야 한다.

---

## 7. 실무·채용 연결

- **`update(id, dto: Partial<Entity>)` 는 관용구.** NestJS 서비스, TypeORM `repo.update(id, partialDto)`가 정확히 이 모양이다. 오늘 실습이 그 원형.
- **DTO 3종 세트**: 생성 DTO(`Omit<T, 'id'>`), 수정 DTO(`Partial<...>`), 응답 DTO(`Pick<T, ...>`)는 실무 API 계층의 표준 구성이다. 유틸리티 타입 없이 이걸 손으로 다 쓰면 중복과 실수가 폭발한다.
- **면접 포인트**: "`Partial`/`Pick`/`Omit`을 언제 쓰나?"는 TypeScript 실무 역량을 가르는 질문이다. "부분 업데이트엔 Partial, 생성 입력엔 Omit으로 id 제거, 응답엔 Pick으로 노출 필드 제한"이 모범 답.

---

## 8. 흔한 실수와 함정

1. **`update`에서 `id`가 patch로 덮여 바뀜.** 병합 시 `{ ...existing, ...patch }`만 하면 patch에 `id`가 있을 경우 식별자가 바뀐다. `Omit<T, 'id'>`로 타입에서 막고, 병합 시에도 `id: existing.id`로 한 번 더 지킨다("타입 방어 + 런타임 방어").
2. **`Partial`을 반환 타입에 오용.** `Partial<T>`는 "입력을 느슨하게" 받을 때 쓴다. 완전한 엔티티를 돌려줘야 하는 자리에 `Partial<T>`를 반환하면 호출자가 모든 필드를 `undefined` 가능으로 취급해야 해 불편해진다.
3. **`Pick`/`Omit`의 키를 오타.** `Omit<Product, 'idd'>`처럼 없는 키를 넣어도 `Omit`은(구버전에선) 조용히 넘어갈 수 있다. 최신 TS는 잡아주지만, 키 유니온을 신중히 쓴다.
4. **유틸리티를 안 쓰고 손으로 중복 정의.** `interface UpdateProductDto { name?: string; price?: number; ... }`를 매번 손으로 쓰면 원본과 어긋난다. `Partial<Omit<Product,'id'>>` 한 줄이 원본과 자동 동기화된다.

---

## 9. 오늘 실습과의 연결 (힌트 수준)

- `update(id, patch): T | undefined` — 5절의 `Partial<Omit<T, 'id'>>`가 patch 타입이다. 파일 힌트가 알려주듯 `findById` → 없으면 `undefined` → 있으면 `{ ...existing, ...patch, id: existing.id }` 병합 → `save`. 함정 1번(id 방어)이 여기 핵심이다.
- `findWhere(criteria: Partial<T>): T[]` — 조건을 일부 필드만 넘길 수 있어야 하니 `Partial<T>`다. `findAll`을 돌며 criteria의 **모든 키**에 대해 값이 일치하는 것만 남긴다(shallow match). `Object.keys(criteria)`를 `(keyof T)[]`로 단언해 순회하면 편하다.
- 시그니처를 직접 채우는 TODO에선, 6절의 질문(전부/일부? 못 바꿀 필드? 없을 수 있나?)을 스스로 던져 타입을 조립하라.

> 답을 여기 적지 않는다. patch 타입을 왜 `Partial<Omit<T,'id'>>`로 두는지 5절을 다시 읽고 스스로 납득한 뒤 손대라.

---

## 10. 셀프 체크

1. `Partial<T>`의 정의(`{ [K in keyof T]?: T[K] }`)에서 `?`를 빼면 무슨 타입이 되는가?
2. `Pick<Product, 'id'|'name'>`과 `Omit<Product, 'price'|'inStock'>`는 같은 타입인가?
3. `Partial<Omit<Product, 'id'>>`를 한국어로 풀어 설명하라.
4. `update`에서 타입으로 id를 막았는데도 런타임에서 `id: existing.id`를 또 지키는 이유는?
5. 생성 DTO에 `Omit<T,'id'>`, 수정 DTO에 `Partial<...>`, 응답 DTO에 `Pick<...>`을 쓰는 이유를 각각 한 줄로.
