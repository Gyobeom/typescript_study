# Day 2 — 메서드 데코레이터

> 이론 30분용 노트. 오늘 실습(`exercises/day2-method-decorator.ts`) **전에** 읽는다.
> 전제: Day 1(데코레이터=함수, 팩토리, 정의 시 1회 실행).

## 오늘의 학습 목표

1. 메서드 데코레이터의 **시그니처** `(target, propertyKey, descriptor)`를 설명할 수 있다.
2. **PropertyDescriptor**가 무엇이고, `descriptor.value`가 왜 "원본 함수"인지 안다.
3. "원본 보관 → `descriptor.value` 교체 → 내부에서 `apply(this, args)`"라는 **감싸기(wrapping) 패턴**을 손으로 그릴 수 있다.
4. `this` 바인딩이 왜 `call`/`apply`로 유지되어야 하는지 이해한다.
5. 이게 AOP(관점 지향 프로그래밍)의 축소판이며 `NestJS AOP 라이브러리`의 원리임을 안다.

---

## 개념 설명

### 1. 클래스 데코레이터와 무엇이 다른가

Day 1의 클래스 데코레이터는 인자가 **1개**(생성자)였다. 메서드 데코레이터는 인자가 **3개**다.

```typescript
function LogCall(
  target: object,               // 인스턴스 메서드면 클래스의 prototype
  propertyKey: string | symbol, // 메서드 이름 (예: 'save')
  descriptor: PropertyDescriptor,
): PropertyDescriptor | void {
  // ...
}
```

- `target` — **인스턴스 메서드**면 클래스의 **프로토타입**이다(인스턴스가 아니다!). static 메서드면 생성자 함수다.
- `propertyKey` — 메서드 이름 문자열(또는 심볼).
- `descriptor` — 그 메서드의 **속성 서술자(PropertyDescriptor)**.

### 2. PropertyDescriptor와 `descriptor.value`

자바스크립트에서 객체의 프로퍼티는 그냥 "값"이 아니라 여러 속성을 가진 **서술자**로 정의된다.

```typescript
// 어떤 메서드 save 의 서술자는 대략 이렇게 생겼다:
{
  value: function save() { /* 원본 코드 */ }, // ← 실제 함수가 여기 들어 있다
  writable: true,
  enumerable: false,
  configurable: true,
}
```

핵심: **메서드의 실제 구현은 `descriptor.value`에 담겨 있다.** 따라서 메서드 데코레이터의 일은 결국 "`descriptor.value`를 다른 함수로 바꿔치기하는 것"이다.

### 3. 감싸기(wrapping) 패턴 — 이 스테이지의 핵심 기법

부가 동작(로깅·캐싱·트랜잭션)을 원본 메서드 **앞뒤에** 끼워 넣는 표준 레시피:

```typescript
function LogCall(target, propertyKey, descriptor) {
  const original = descriptor.value;          // ① 원본을 보관
  descriptor.value = function (...args) {      // ② 새 함수로 교체
    console.log(`${String(propertyKey)} 시작`); // ③ 앞 동작
    const result = original.apply(this, args);  // ④ 원본 실행 (this·인자 그대로)
    console.log(`${String(propertyKey)} 끝`);   // ⑤ 뒤 동작
    return result;                              // ⑥ 결과 그대로 반환
  };
  return descriptor;                            // ⑦ 바뀐 서술자 반환
}
```

이 7단계 골격이 로깅이든 캐싱이든 재시도든 전부 동일하다. 바뀌는 건 ③⑤에 무엇을 넣느냐뿐이다.

### 4. `this` 바인딩 — 왜 `apply`/`call`인가

②의 교체 함수는 반드시 **일반 함수 `function (...)`**로 써야 한다. 화살표 함수로 쓰면 `this`가 호출 시점의 인스턴스가 아니라 정의 시점의 바깥 스코프로 고정되어, 인스턴스 필드에 접근할 수 없다.

그리고 원본을 부를 때 `original(...args)`가 아니라 **`original.apply(this, args)`**로 불러야 한다. 그래야 원본 메서드 안의 `this`가 실제 인스턴스를 가리킨다.

```typescript
class Cart {
  private items: string[] = [];
  @LogCall
  add(item: string) {
    this.items.push(item); // ← 이 this 가 인스턴스여야 한다
  }
}
```

교체 함수가 `original.apply(this, args)`로 부르면, `cart.add('apple')` 호출 시 `this === cart`가 그대로 전달된다.

### 5. 상태를 어디에 둘 것인가 — 캐시(메모이제이션) 예시

로깅은 상태가 없지만, 캐싱은 "이미 계산한 결과"를 어딘가 저장해야 한다. 이때 **인스턴스별로 캐시를 분리**하려면 캐시를 클로저가 아니라 **`this` 위에** 둔다.

```typescript
function CacheResult(target, propertyKey, descriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args) {
    const store = (this.__cache__ ??= new Map()); // 인스턴스마다 별도 Map
    const key = JSON.stringify(args);             // 인자를 키로
    if (store.has(key)) return store.get(key);    // 캐시 적중
    const result = original.apply(this, args);
    store.set(key, result);
    return result;
  };
  return descriptor;
}
```

- **키 만들기**: `JSON.stringify(args)`가 간단하지만 한계가 있다(아래 함정 4).
- **캐시 위치**: 클로저에 두면 모든 인스턴스가 캐시를 **공유**해 버린다. `this` 위에 두면 인스턴스별로 분리된다. "어디에 두느냐"가 곧 스코프 결정이다.

> ⚠️ **주의(레거시 vs 표준):** 위 `(target, propertyKey, descriptor)` 3-인자 시그니처는 `experimentalDecorators` 기준 **레거시 데코레이터**다. TC39 stage 3 **표준 데코레이터**의 메서드 데코레이터는 `(originalMethod, context)`라는 전혀 다른 시그니처를 쓰고 PropertyDescriptor를 직접 만지지 않는다. NestJS 생태계는 아직 레거시 기준이므로 지금은 이 3-인자 형태를 배운다.

---

## 실무·채용 연결

- **AOP(관점 지향 프로그래밍)**: 로깅·트랜잭션·캐싱·권한 검사 같은 "핵심 로직과 무관하지만 여기저기 반복되는 관심사"를 메서드 감싸기로 한 곳에서 주입하는 기법이다. 오늘의 감싸기 패턴이 그 원리다.
- **`NestJS AOP 라이브러리`**: 국내 테크 기업가 사내 표준화한 AOP 라이브러리로, 메서드 데코레이터로 트랜잭션·로깅 같은 관점을 붙인다. 오늘의 `@LogExecution`이 그 축소판이다. 원리를 알면 그 라이브러리 코드가 "번역 없이" 읽힌다.
- 실무에서 `@Transactional`, `@Retry`, `@Cacheable` 같은 데코레이터를 마주치면, 십중팔구 이 감싸기 패턴 위에 서 있다.

---

## 흔한 실수와 함정

1. **화살표 함수로 교체한다.** `descriptor.value = (...args) => {...}`로 쓰면 `this`가 인스턴스를 못 가리킨다. 반드시 `function (...args) {...}`.
2. **`original.apply(this, args)` 대신 `original(...args)`로 부른다.** `this`가 끊겨 인스턴스 필드 접근이 깨진다.
3. **`return descriptor`(또는 return 없음)를 빠뜨려도 레거시에선 종종 동작하지만**, 명시적으로 돌려주는 습관이 안전하다. 원본 반환값(`return result`)을 빠뜨리면 메서드가 항상 `undefined`를 준다.
4. **`JSON.stringify(args)`로 만든 캐시 키의 한계.** 함수·심볼·`undefined`·순환 참조는 직렬화가 안 되거나 정보가 사라진다. 프로퍼티 순서가 다른 객체는 다른 키가 된다. 실습 범위에선 원시값 인자면 충분하지만, 한계는 알아둔다.
5. **캐시를 클로저에 두어 인스턴스 간에 새어 나간다.** 인스턴스별 분리가 필요하면 `this` 위에 둔다.

---

## 오늘 실습과의 연결

오늘 구현할 두 데코레이터는 위 패턴의 직접 실습이다(힌트 수준만):

- `@LogExecution` — 감싸기 패턴의 **상태 없는** 버전. 전역 `executionLog` 배열에 `"<메서드이름> called"`를 남기고, 원본 반환값은 그대로 통과시켜야 한다(함정 3). 반환값·인자·호출 횟수가 모두 보존되는지가 테스트 포인트다.
- `@Memoize` — 감싸기 패턴의 **상태 있는** 버전. 캐시 키 만들기(개념 5)와 캐시 위치(인스턴스별 분리, 함정 5)를 스스로 정해야 한다. "같은 인자면 원본을 다시 안 부른다", "인스턴스마다 캐시가 다르다"가 핵심 기대치다.

막히면 20분 후 `solutions/`와 비교한다.

---

## 셀프 체크

1. 메서드 데코레이터의 세 인자 이름과 각각의 의미를 말해 보라. `target`은 인스턴스인가 프로토타입인가?
2. 메서드의 실제 함수 본문은 서술자의 어느 필드에 있는가?
3. 교체 함수에서 원본을 `original.apply(this, args)`로 부르는 이유를 `this` 관점에서 설명하라.
4. 화살표 함수로 `descriptor.value`를 교체하면 어떤 문제가 생기는가?
5. 캐시를 클로저에 두는 것과 `this`에 두는 것의 차이는 무엇인가?
