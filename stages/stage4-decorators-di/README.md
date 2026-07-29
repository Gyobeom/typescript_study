# 스테이지 4 — 데코레이터와 DI(의존성 주입)

> **한 줄 목표**: NestJS의 `@Injectable()`·`@Controller()`가 "마법"이 아니라 **함수 + 메타데이터**의 조합임을 원리로 이해하고, `reflect-metadata`로 **미니 DI 컨테이너를 직접 구현**한다.

이 스테이지를 끝내면, NestJS를 처음 열었을 때 마주치는 데코레이터 더미가 "블랙박스"에서 "내가 만들 수 있는 것"으로 바뀐다.

---

## 1. 개념 — 데코레이터란 무엇인가

### 1-1. 데코레이터는 그냥 "함수"다

데코레이터는 클래스/메서드/프로퍼티를 **받아서 뭔가 하는 함수**일 뿐이다. `@` 문법은 "이 함수를 이 선언에 적용해라"라는 설탕(sugar)이다.

```typescript
// 이 두 줄은 사실상 같다.
@Frozen
class Service {}

// ↓ 컴파일러가 대략 이렇게 처리한다
class Service {}
Frozen(Service); // Service 의 "생성자 함수"가 인자로 넘어간다
```

**클래스 데코레이터**의 시그니처는 `(constructor: Function) => void`. 인자로 클래스의 생성자 함수 하나를 받는다.

### 1-2. 데코레이터 팩토리 — 인자를 받고 싶을 때

`@Tagged('users')`처럼 **인자를 받는 데코레이터**는, "데코레이터를 반환하는 함수"(팩토리)로 만든다.

```typescript
function Tagged(name: string): ClassDecorator {
  return (constructor) => {
    (constructor as any).__tag__ = name; // 클로저로 붙잡은 name 을 심는다
  };
}

@Tagged('users') // Tagged('users') 를 먼저 호출 → 반환된 데코레이터가 클래스에 적용됨
class UserController {}
```

NestJS의 `@Controller('users')`, `@Get(':id')`가 전부 이 팩토리 패턴이다.

### 1-3. 메서드 데코레이터 — 원본을 감싸기

메서드 데코레이터의 시그니처는 `(target, propertyKey, descriptor)`. 핵심은 **원본 함수를 보관했다가, `descriptor.value`를 새 함수로 교체하고, 그 안에서 원본을 `apply(this, args)`로 호출**하는 것이다. 로깅·캐싱·트랜잭션 같은 부가 관심사(AOP)를 이렇게 끼워 넣는다.

```typescript
function LogExecution(target, propertyKey, descriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args) {
    console.log(`${String(propertyKey)} called`);
    return original.apply(this, args); // this 바인딩·인자 그대로 전달
  };
  return descriptor;
}
```

### 1-4. reflect-metadata — DI의 심장

`reflect-metadata`는 클래스/객체에 **보이지 않는 꼬리표(메타데이터)를 붙이고 읽는** 표준 API다.

```typescript
import 'reflect-metadata';
Reflect.defineMetadata('role', 'admin', SomeClass); // 심기
Reflect.getMetadata('role', SomeClass); // 'admin' 읽기
```

가장 중요한 건 **컴파일러가 자동으로 심어주는 메타데이터**다. `emitDecoratorMetadata: true`이고 클래스에 데코레이터가 **하나라도** 붙어 있으면, TS 컴파일러가 생성자 파라미터 타입 목록을 `design:paramtypes` 키로 심어준다.

```typescript
@Injectable()
class UserService {
  constructor(private repo: UserRepository) {}
}

Reflect.getMetadata('design:paramtypes', UserService);
// → [UserRepository]  ← 생성자가 무엇을 필요로 하는지 "타입 그대로" 읽힌다!
```

### 1-5. "NestJS의 @Injectable()이 실제로 하는 일"

정리하면 NestJS DI는 다음 3단계다. 이 스테이지에서 **직접 만든다**.

1. `@Injectable()`이 클래스에 "주입 가능" 메타데이터를 심는다. (동시에 `design:paramtypes` 방출을 트리거한다.)
2. 컨테이너가 `resolve(SomeClass)`될 때 `design:paramtypes`를 읽어 **무엇을 주입해야 하는지** 알아낸다.
3. 각 의존성을 **재귀적으로** 생성해 `new SomeClass(...deps)`로 주입하고, 만든 인스턴스는 **싱글턴으로 캐싱**한다.

즉 `@Injectable()`은 마법이 아니라 **"이 클래스를 컨테이너가 관리해도 좋다"는 표식 + 타입 메타데이터 방출 트리거**일 뿐이다.

---

## 2. 채용 연관성 — 왜 이걸 배우나

- **실무 기술블로그 "NestJS 환경에 맞는 Custom Decorator 만들기"**는 정확히 이 스테이지 수준의 지식(클래스/메서드/파라미터 데코레이터, 메타데이터, IoC)을 **전제**로 읽힌다. 이 스테이지를 마치면 그 글이 "번역 없이" 읽힌다.
- **`NestJS AOP 라이브러리`** 같은 사내 라이브러리는 메서드 데코레이터로 관점(로깅·트랜잭션·캐싱)을 주입하는 AOP를 표준화한 것이다. Day 2의 `@LogExecution`이 그 축소판이다.
- 실무 면접에서 "NestJS DI가 내부적으로 어떻게 동작하나요?"는 단골 질문이다. Day 4~5의 미니 컨테이너를 손으로 만들어봤다면 `design:paramtypes`와 재귀 resolve, 싱글턴 스코프를 자기 말로 설명할 수 있다.

---

## 3. 일차별 문제

| 일차 | 파일 | 주제 | 핵심 |
|---|---|---|---|
| Day 1 | `day1-class-decorator.ts` | 클래스 데코레이터 | `@Frozen`(클래스를 받는 함수), `@Tagged('name')`(팩토리), `getTag` |
| Day 2 | `day2-method-decorator.ts` | 메서드 데코레이터 | `@LogExecution`(호출 기록), `@Memoize`(인자 기준 캐싱) — 원본 감싸기 |
| Day 3 | `day3-metadata.ts` | reflect-metadata | `defineMetadata`/`getMetadata`, `@WithRole`, **`design:paramtypes` 읽기** |
| Day 4~5 | `day4-mini-di-container.ts` | **미니 DI 컨테이너** | `isInjectable` + `Container.resolve()` 재귀 주입 + 싱글턴 (Repo ← Service ← Controller 3단). `@Injectable()` 마커는 완성 제공됨 |

각 파일은 `throw new Error('TODO: ...')`로 비어 있고, TODO마다 한국어 힌트 주석이 있다. `exercises/`를 열어 TODO를 채우면 된다.

---

## 4. 진행 방법

```bash
# 내 구현(exercises) 채점 — 처음엔 다수 실패가 정상
npm run check:stage4

# 모범 답안 대상으로 테스트 자체 검증 — 전체 통과해야 함
npm run check:stage4:answer

# 전체 타입 체크 (strict)
npm run typecheck
```

**루틴**: `npm run check:stage4`로 실패를 확인 → `exercises/`의 TODO 구현 → 초록이 될 때까지 반복. **20분 이상 막히면** `solutions/`의 같은 파일명을 열어 **비교**하고, 답을 덮은 뒤 다시 스스로 작성한다.

> **주의**: 데코레이터·메타데이터가 필요한 파일과 테스트는 최상단에 `import 'reflect-metadata';`가 있어야 한다. 이 스테이지의 파일들은 이미 포함되어 있으니, 직접 실험 파일을 만들 때도 잊지 말 것.
