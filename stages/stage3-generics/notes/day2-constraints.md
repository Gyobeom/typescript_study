# Day 2 — 제네릭 제약(`T extends ...`)과 `keyof`

> 실습 전 30분 이론. 오늘 실습은 `LengthTracker<T extends {length}>`와 `PropertyPicker<T>.pluck/pick`이다.
> 이 노트는 실습과 다른 예시(도형·설정 객체)로 제약과 `keyof`를 먼저 익힌다.

---

## 오늘의 학습 목표

1. 제약 없는 `T`는 왜 프로퍼티 접근이 막히는지, **그 에러 메시지까지** 설명할 수 있다.
2. `T extends { ... }`로 "이런 모양을 반드시 가진 타입만"으로 좁히는 법을 안다.
3. `extends`가 클래스 상속의 `extends`와 **다른 의미**(제약)임을 구분한다.
4. `keyof T`가 "T의 키들의 유니온 타입"임을 이해하고 예를 든다.
5. `K extends keyof T` + 반환 타입 `T[K]`로 **키도 값도 타입 안전한** 접근을 만든다.

---

## 1. 제약 없는 `T`는 "아무것도 못 한다"

Day 1의 `T`는 자유로웠다. 그런데 그 자유에는 대가가 있다. `T`가 **무엇이든** 될 수 있으니, 컴파일러는 `T`에 어떤 프로퍼티가 있는지 알 수 없다.

```ts
function firstChar<T>(x: T): string {
  return x[0]; // ❌
}
```

에러:

```
Element implicitly has an 'any' type because expression of type '0'
can't be used to index type 'T'.
```

`T`가 문자열일 수도, 숫자일 수도, `{name: string}`일 수도 있으니 `x[0]`이 성립한다는 보장이 없다. 컴파일러가 막는 게 **정상**이다.

프로퍼티에 접근하려면 "이 `T`는 최소한 이런 모양이다"라고 **약속**해야 한다. 그게 제약이다.

---

## 2. `T extends { ... }` — 모양으로 좁히기

```ts
function firstChar<T extends { length: number; [i: number]: string }>(x: T): string {
  return x[0]; // ✅ 이제 인덱싱이 허용된다
}
firstChar('hello'); // ✅ string은 이 모양을 만족
firstChar([1, 2, 3]); // ❌ number[]는 [i]: string 을 만족 안 함
```

제약을 걸면 두 가지가 생긴다.
1. **호출 쪽 필터링**: 그 모양을 만족하지 않는 인자는 컴파일 에러.
2. **본문 쪽 권한**: 이제 그 모양의 프로퍼티에 안전하게 접근 가능.

더 흔한 예 — `length`를 가진 것만:

```ts
function totalSize<T extends { length: number }>(items: T[]): number {
  return items.reduce((sum, x) => sum + x.length, 0);
}
totalSize(['ab', 'cde']);        // ✅ string은 length가 있다 → 5
totalSize([[1], [2, 3]]);        // ✅ 배열도 length가 있다 → 3
totalSize([1, 2, 3]);            // ❌ number엔 length가 없다
```

`number`를 넣으면:

```
Type 'number' is not assignable to type '{ length: number; }'.
```

> ⚠️ 주의: 여기서 `extends`는 **클래스 상속이 아니다.** "T는 이 타입을 **부분집합처럼 만족한다**(assignable)"는 제약이다. 상속 `class Dog extends Animal`과 키워드만 같을 뿐 의미가 다르다.

---

## 3. `keyof` — 객체의 키를 타입으로

`keyof T`는 T가 가진 **프로퍼티 키들을 유니온 타입**으로 만든다.

```ts
interface Config {
  host: string;
  port: number;
  secure: boolean;
}

type ConfigKey = keyof Config; // 'host' | 'port' | 'secure'
```

이건 **값이 아니라 타입**이다. `'host' | 'port' | 'secure'`라는 문자열 리터럴 유니온이 컴파일 타임에 만들어진다. 오타를 컴파일러가 잡아준다.

```ts
let k: ConfigKey = 'host'; // ✅
k = 'hostname';            // ❌ Type '"hostname"' is not assignable to type 'keyof Config'.
```

---

## 4. `K extends keyof T`와 `T[K]` — 안전한 프로퍼티 접근기

이 둘을 합치면 "존재하는 키만 받고, 그 키의 값 타입을 정확히 돌려주는" 함수가 된다.

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const cfg = { host: 'localhost', port: 8080, secure: true };

const h = get(cfg, 'host');   // h: string
const p = get(cfg, 'port');   // p: number  ← 값 타입까지 정확!
const x = get(cfg, 'timeout'); // ❌ Argument of type '"timeout"' is not assignable
                               //    to parameter of type '"host" | "port" | "secure"'.
```

여기서 `T[K]`는 **인덱스 접근 타입**이다. "T에서 K라는 키의 값 타입"을 뜻한다. `key`가 `'port'`면 `T[K]`가 `number`로 굳는다. 그래서 반환값의 타입이 정확하다.

`any`로 짰다면 `get(cfg, 'timeout')`도, 반환 타입이 뭉개지는 것도 전부 통과했을 것이다. `keyof`+`T[K]`는 그걸 컴파일 단계에서 막는다.

---

## 5. `Pick<T, K>` 맛보기 (Day 5 예고)

여러 키를 골라 부분 객체를 만들 때 반환 타입은 `Pick<T, K>`로 표현한다.

```ts
function project<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = obj[k];
  return out;
}

const small = project(cfg, ['host', 'port']); // 타입: { host: string; port: number }
```

`Pick`은 Day 5에서 본격적으로 다룬다. 오늘은 "여러 키를 고르면 반환 타입이 `Pick`이 된다"만 눈에 익히면 된다.

---

## 6. 실무·채용 연결

- **TypeORM/NestJS의 안전한 컬럼 지정**: `find({ where: { ... } })`, `select` 옵션이 내부적으로 `keyof Entity`로 제약돼 있어 존재하지 않는 컬럼명을 컴파일 단계에서 막는다.
- **폼/DTO 라이브러리**: `keyof`로 필드 이름을 제약하는 게 표준이다. `class-validator`, `react-hook-form`의 필드 접근이 이 원리다.
- **면접 포인트**: "제네릭 제약을 왜 거나?"에 "제약이 없으면 T의 멤버에 접근할 수 없어서 — 컴파일러가 T의 모양을 모르니까"라고 답할 수 있으면 이해가 검증된다.

---

## 7. 흔한 실수와 함정

1. **제약 대신 캐스팅으로 우회.** `(x as any).length` 로 밀어붙이면 에러는 사라지지만 안전성도 사라진다. 제약을 거는 게 정답이다.
2. **`keyof`를 값처럼 착각.** `keyof T`는 타입이지 런타임 값이 아니다. 실제 키 배열이 필요하면 `Object.keys(obj)`(런타임)를 쓰되, 그 반환은 `string[]`이라 `keyof T`로 좁히려면 단언이 필요하다.
3. **`extends`를 상속으로 오해.** `T extends { length: number }`는 상속이 아니라 "assignable해야 한다"는 제약이다.
4. **제약을 너무 좁게.** `T extends { length: number; name: string }`처럼 불필요한 프로퍼티까지 요구하면 재사용성이 떨어진다. **본문에서 실제 쓰는 것만** 제약에 넣는다.

---

## 8. 오늘 실습과의 연결 (힌트 수준)

- `LengthTracker<T extends { length: number }>`: 제약 덕분에 본문에서 `.length`에 마음 놓고 접근할 수 있다. 합계는 순회 누적, 최댓값은 비교 순회다. 비어 있으면 `undefined`를 잊지 말 것(Day 1 함정 2번과 동일).
- `PropertyPicker<T>.pluck<K extends keyof T>(key): T[K]`: 4절의 `get`과 같은 골격이다. `source[key]`를 그대로 돌려주면 타입이 맞는다.
- `pick`은 5절의 `project`와 같은 모양이다. 빈 객체에서 시작해 키를 순회하며 채우고, 반환 타입을 `Pick<T, K>`로 맞춘다(단언 허용).
- 테스트에 `@ts-expect-error`가 있다. **존재하지 않는 키로 호출하면 컴파일 에러가 나야** 통과한다 — 즉 제약이 실제로 작동하는지까지 검증한다.

---

## 9. 셀프 체크

1. 제약 없는 `<T>`에서 `x.length`에 접근하면 왜 에러가 나는가? 에러 메시지의 핵심 단어는?
2. `T extends { length: number }`의 `extends`는 클래스 상속과 같은 의미인가? 다르다면 무슨 뜻인가?
3. `keyof { a: string; b: number }`의 결과 타입을 쓰라.
4. `get<T, K extends keyof T>(obj, key): T[K]`에서 `T[K]`는 무엇을 뜻하는가?
5. `pick`의 반환 타입을 `Pick<T, K>`로 두는 이유는? `T`로 두면 뭐가 문제인가?
