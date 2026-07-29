# Day 1 — 클래스 데코레이터

> 이론 30분용 노트. 오늘 실습(`exercises/day1-class-decorator.ts`) **전에** 읽는다.

## 오늘의 학습 목표

1. "데코레이터는 그냥 함수다"라는 문장을 코드로 설명할 수 있다.
2. 클래스 데코레이터의 **시그니처**와 **실행 시점**(정의 시 1회)을 안다.
3. **데코레이터 팩토리**(인자를 받는 데코레이터)가 왜 "함수를 반환하는 함수"인지 설명할 수 있다.
4. 데코레이터로 클래스에 **정보를 심고**, 나중에 그 정보를 **다시 읽는** 왕복 구조를 이해한다.
5. NestJS의 `@Controller('users')`가 이 팩토리 패턴의 실물임을 안다.

---

## 개념 설명

### 1. 데코레이터는 그냥 함수다

데코레이터를 처음 보면 "특별한 문법"처럼 보이지만, 본질은 **선언(클래스/메서드/…)을 인자로 받아 무언가 하는 함수**다. `@` 기호는 "이 함수를 이 선언에 적용하라"는 **문법 설탕(syntactic sugar)**일 뿐이다.

```typescript
// 아래 두 형태는 개념적으로 같다.
@Sealed
class Plugin {}

// ↓ 컴파일러가 대략 이렇게 처리한다
class Plugin {}
Sealed(Plugin); // 클래스의 "생성자 함수" 자체가 인자로 넘어간다
```

여기서 반드시 기억할 것: `@`가 넘기는 것은 인스턴스가 아니라 **클래스(생성자 함수) 그 자체**다. `new Plugin()`이 아니라 `Plugin`이 넘어간다.

### 2. 클래스 데코레이터의 시그니처

```typescript
function Sealed(constructor: Function): void {
  Object.seal(constructor);
}
```

- 인자는 **딱 하나**, 대상 클래스의 생성자 함수다.
- 반환값은 보통 `void`(부수효과만 냄). 새 생성자를 `return`하면 클래스를 통째로 교체할 수도 있지만, 이 스테이지에서는 다루지 않는다.

TypeScript는 이 형태를 `ClassDecorator` 타입으로 제공한다:

```typescript
type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
```

### 3. 실행 시점 — "정의 시 딱 1회"

이게 초심자가 가장 자주 헷갈리는 지점이다. **데코레이터는 인스턴스를 만들 때(`new`) 실행되지 않는다.** 클래스가 **정의(로드)되는 순간 단 한 번** 실행된다.

```typescript
function Trace(constructor: Function): void {
  console.log('decorator ran:', constructor.name);
}

@Trace
class Widget {}      // 여기서 즉시 "decorator ran: Widget" 출력

new Widget();        // 아무 것도 출력 안 됨
new Widget();        // 역시 아무 것도 출력 안 됨
```

정리하면:
- **데코레이터 본문** = 클래스 로드 시 1회.
- **인스턴스별 로직**을 넣고 싶다면 데코레이터 본문이 아니라, 데코레이터가 **교체·감싸는 함수 안**에 넣어야 한다(→ Day 2 메서드 데코레이터에서 다룬다).

### 4. 데코레이터 팩토리 — 인자를 받고 싶을 때

`@Sealed`는 인자가 없다. 그런데 `@Tag('cache')`처럼 **인자를 받는 데코레이터**는 어떻게 만들까? `@` 뒤에는 "데코레이터 함수"가 와야 하는데, `Tag('cache')`는 함수 호출이지 함수가 아니다.

해법: **데코레이터를 반환하는 함수**(=팩토리)를 만든다.

```typescript
function Tag(label: string): ClassDecorator {
  // 바깥 함수: 인자(label)를 받는다.
  return (constructor) => {
    // 안쪽 함수: 진짜 데코레이터. 클로저로 label 을 붙잡고 있다.
    (constructor as any).__tag__ = label;
  };
}

@Tag('cache') // ① Tag('cache') 를 먼저 호출 → ② 반환된 데코레이터가 클래스에 적용
class RedisStore {}
```

실행 순서를 손으로 풀면:

```typescript
const decorator = Tag('cache'); // 팩토리 호출 → 데코레이터 함수 반환
decorator(RedisStore);          // 그 데코레이터를 클래스에 적용
```

즉 `@` 뒤에 **함수 호출**(`Tag(...)`)이 오면, 그건 팩토리라는 신호다. "괄호가 붙으면 팩토리, 안 붙으면 그냥 데코레이터"로 외워두면 편하다.

### 5. 심기 → 읽기의 왕복

데코레이터로 클래스에 정보를 심었으면, 나중에 그 정보를 **읽는 함수**도 짝으로 필요하다.

```typescript
function getTagOf(target: Function): string | undefined {
  return (target as any).__tag__;
}

getTagOf(RedisStore); // 'cache'
```

이 "심기(데코레이터) ↔ 읽기(조회 함수)"의 왕복이 DI의 뼈대다. Day 3부터는 정적 프로퍼티(`__tag__`) 대신 `reflect-metadata`라는 **표준 저장소**에 심는 방식으로 발전한다.

> ⚠️ **주의(레거시 vs 표준):** 이 스테이지가 쓰는 데코레이터는 `tsconfig`의 `experimentalDecorators`를 켠 **레거시(TC39 stage 2) 문법**이다. 2023년 이후 표준화된 **TC39 stage 3 표준 데코레이터**는 시그니처(`(value, context)`)가 다르고 `reflect-metadata`의 `design:paramtypes` 자동 방출도 없다. NestJS는 아직 레거시 데코레이터 기준이므로, 지금은 레거시를 배우는 게 맞다.

---

## 실무·채용 연결

- **NestJS `@Controller('users')`**가 바로 이 팩토리 패턴이다. `@Controller`는 문자열 경로(prefix)를 받아, "이 클래스는 컨트롤러이고 경로는 `users`다"라는 메타데이터를 클래스에 심는다. 우리가 오늘 만드는 `@Tagged('name')`의 확장판일 뿐이다.
- **`@Injectable()`** 역시 인자 없는(또는 옵션 객체를 받는) 팩토리다. "이 클래스는 컨테이너가 관리해도 된다"는 표식을 심는다. Day 4에서 직접 만든다.
- 실무 기술블로그 **"NestJS 환경에 맞는 Custom Decorator 만들기"**의 첫 단계가 정확히 이것 — 클래스/메서드에 붙는 커스텀 데코레이터를 팩토리로 정의하고 메타데이터를 심는 일이다. 오늘 개념이 그 글의 전제다.

---

## 흔한 실수와 함정

1. **팩토리에서 `return`을 빠뜨린다.** `@Tag('x')`를 쓰려면 `Tag`는 데코레이터 함수를 **반환**해야 한다. `return (c) => {...}`를 안 하면 `undefined`가 데코레이터로 쓰여 런타임 에러가 난다.
2. **데코레이터 본문에 인스턴스별 로직을 넣는다.** 데코레이터는 정의 시 1회만 돈다. "매 호출마다" 무언가 하려면 함수를 감싸야 한다(Day 2).
3. **`prototype`과 생성자 자신을 혼동한다.** 인스턴스 메서드는 `constructor.prototype`에, `static` 멤버는 `constructor` 자신에 있다. `@Frozen`처럼 둘 다 다뤄야 하는 경우 대상을 구분해야 한다.
4. **`@` 없이 그냥 호출해도 되는 걸 몰라 겁먹는다.** `Tag('x')(SomeClass)`처럼 수동 호출도 완전히 유효하다. `@`는 편의 문법일 뿐이다.

---

## 오늘 실습과의 연결

오늘 구현할 세 함수는 위 개념의 최소 실습이다(힌트 수준만):

- `@Frozen` — 클래스 데코레이터가 "함수"임을 몸으로 느끼는 문제. 대상 **두 곳**(프로토타입과 생성자 자신)을 각각 동결해야 한다는 점을 개념 3·함정 3과 연결해 생각해 보라.
- `@Tagged(name)` — 팩토리 패턴. "괄호가 붙으면 반환하는 함수를 만든다"를 떠올려라.
- `getTag(target)` — 심은 정보를 읽는 짝. 없을 때 무엇을 돌려줄지(개념 5)만 정하면 된다.

답은 보지 말고, 막히면 20분 후 `solutions/`와 비교한다.

---

## 셀프 체크

1. `@Sealed`와 `@Tag('x')`의 실행 순서를 각각 "괄호 없는 형태"로 풀어 써 보라.
2. 데코레이터 본문은 클래스당 몇 번 실행되는가? `new`를 100번 하면 몇 번 도는가?
3. 인스턴스 메서드와 static 멤버는 각각 어디(생성자 vs 프로토타입)에 붙는가?
4. 레거시 데코레이터와 TC39 표준 데코레이터의 가장 큰 실무적 차이 하나는?
5. NestJS의 `@Controller('users')`에서 `'users'`는 어디에 어떻게 저장될까(추측)?
