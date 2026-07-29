# Day 3 — reflect-metadata 와 메타데이터 프로그래밍

> 이론 30분용 노트. 오늘 실습(`exercises/day3-metadata.ts`) **전에** 읽는다.
> 전제: Day 1(팩토리로 클래스에 정보 심기), Day 2(감싸기).

## 오늘의 학습 목표

1. `reflect-metadata`가 무엇이고, 왜 정적 프로퍼티(`__tag__`) 대신 이걸 쓰는지 설명할 수 있다.
2. `Reflect.defineMetadata` / `getMetadata`의 **키·값·타깃** 3요소를 안다.
3. `emitDecoratorMetadata`가 만들어 주는 **`design:paramtypes`의 정체**를 이해한다 — DI의 열쇠.
4. `design:paramtypes`가 **왜 인터페이스 타입은 못 읽고, 클래스 타입만 읽는지** 설명할 수 있다.
5. 오늘의 `getParamTypes`가 Day 4 컨테이너의 재료임을 안다.

---

## 개념 설명

### 1. reflect-metadata란 무엇인가

Day 1에서는 클래스에 정보를 `(constructor as any).__tag__ = name`처럼 **정적 프로퍼티**로 심었다. 동작은 하지만 지저분하다 — 클래스 표면을 오염시키고, 여러 라이브러리가 같은 프로퍼티 이름을 쓰면 충돌한다.

`reflect-metadata`는 이 "심기/읽기"를 **표준화된 별도 저장소**로 옮긴다. 클래스 표면은 건드리지 않고, 보이지 않는 꼬리표를 붙인다.

```typescript
import 'reflect-metadata'; // ← 반드시 최상단에서 1회. 전역 Reflect 를 확장한다

Reflect.defineMetadata('role', 'admin', SomeClass); // 심기
Reflect.getMetadata('role', SomeClass);             // 'admin' 읽기
Reflect.hasMetadata('role', SomeClass);             // true
```

세 요소: **키**(`'role'`), **값**(`'admin'`), **타깃**(`SomeClass`). Day 1의 `__tag__` 왕복을 표준 API로 바꾼 것뿐이다.

### 2. 사용자 메타데이터 심기 → 데코레이터로 감싸기

먼저 함수로 심고 읽는다:

```typescript
function markRole(target: object, role: string) {
  Reflect.defineMetadata('role', role, target);
}
function readRole(target: object): string | undefined {
  return Reflect.getMetadata('role', target);
}
```

그리고 이걸 **데코레이터 팩토리**(Day 1 패턴)로 감싸면 선언적으로 쓸 수 있다:

```typescript
function Role(role: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('role', role, target);
  };
}

@Role('admin')
class AdminPanel {}

readRole(AdminPanel); // 'admin'
```

이게 커스텀 데코레이터의 표준 형태다: **데코레이터가 메타데이터를 심고, 별도 헬퍼가 그걸 읽는다.**

### 3. `design:paramtypes` — 컴파일러가 자동으로 심는 메타데이터 (핵심)

여기가 오늘의 클라이맥스이자 DI 전체의 열쇠다.

`tsconfig`에 `emitDecoratorMetadata: true`가 켜져 있고, 어떤 클래스에 **데코레이터가 하나라도 붙어 있으면**, TypeScript 컴파일러가 **자동으로** 그 클래스에 생성자 파라미터의 **타입 목록**을 `'design:paramtypes'` 키로 심어 준다.

```typescript
class Engine {}
class Gearbox {}

@Role('vehicle') // ← 아무 데코레이터나 "하나라도" 있어야 방출이 트리거된다
class Car {
  constructor(
    public engine: Engine,
    public gearbox: Gearbox,
  ) {}
}

Reflect.getMetadata('design:paramtypes', Car);
// → [Engine, Gearbox]   ← 생성자가 무엇을 필요로 하는지, "클래스 그 자체"의 배열로 읽힌다!
```

무엇이 놀라운가: 보통 TypeScript의 타입은 **컴파일되면 사라진다**(런타임에 존재하지 않는다). 그런데 `emitDecoratorMetadata`는 생성자 파라미터의 타입만은 **런타임까지 살려서** 실제 생성자 함수 배열로 남겨 준다. 덕분에 런타임에 "이 클래스는 `Engine`과 `Gearbox`가 필요하다"를 코드가 알 수 있다.

이 한 줄 — `Reflect.getMetadata('design:paramtypes', Cls)` — 이 없으면 자동 DI는 불가능하다.

### 4. 왜 "데코레이터가 하나라도" 있어야 하나

컴파일러는 성능상 **모든** 클래스에 타입 메타데이터를 심지 않는다. 클래스에 데코레이터가 붙어 있을 때만 "이건 메타데이터가 필요한 클래스구나" 판단하고 방출한다. 그래서 실습 테스트에서 파라미터 타입을 읽고 싶은 `Car`에도 `@Role('vehicle')` 같은 **트리거용 데코레이터**를 일부러 붙인다. 데코레이터가 전혀 없는 순수 클래스는 `design:paramtypes`가 아예 없어서 `getMetadata`가 `undefined`를 준다(→ 그래서 없으면 빈 배열로 처리한다).

### 5. 관련 자동 메타데이터 키

`design:paramtypes` 외에도 컴파일러가 심어 주는 키가 있다(참고):

| 키 | 의미 |
|---|---|
| `design:type` | 프로퍼티/접근자의 타입 |
| `design:paramtypes` | **생성자·메서드 파라미터 타입 배열** (DI가 쓰는 것) |
| `design:returntype` | 메서드 반환 타입 |

DI에서 압도적으로 중요한 건 `design:paramtypes`다.

### 6. 데코레이터 유무에 따라 무엇이 달라지는지 — 나란히 보기

같은 클래스라도 데코레이터가 붙었느냐에 따라 읽히는 값이 완전히 달라진다.

```typescript
// (A) 데코레이터 없음 → 컴파일러가 타입을 방출하지 않는다
class Report {
  constructor(public formatter: Formatter) {}
}
Reflect.getMetadata('design:paramtypes', Report);
// → undefined   ← 아무 것도 심기지 않았다

// (B) 데코레이터 하나 붙임 → 방출 트리거
@Role('report')
class Report2 {
  constructor(public formatter: Formatter) {}
}
Reflect.getMetadata('design:paramtypes', Report2);
// → [Formatter]  ← 이제 읽힌다
```

이 차이가 실습에서 "없으면 빈 배열로 방어한다"(`?? []`)를 넣는 직접적 이유다. `undefined`가 그대로 나오면 뒤에서 `.map`이 터지기 때문이다.

> ⚠️ **주의(레거시 vs 표준):** `design:paramtypes` 자동 방출은 `experimentalDecorators` + `emitDecoratorMetadata` 조합, 즉 **레거시 데코레이터** 전용 기능이다. TC39 stage 3 **표준 데코레이터**에는 이 자동 타입 방출이 **없다**(그래서 표준 데코레이터 기반 DI는 다른 방식을 쓴다). NestJS가 아직 레거시를 쓰는 핵심 이유가 바로 이 기능이다.

---

## 실무·채용 연결

- **NestJS `@Injectable()`의 진짜 임무 두 가지**: ① "이 클래스는 컨테이너가 관리 가능"이라는 마커 메타데이터를 심고, ② (자신이 데코레이터이므로) 컴파일러가 그 클래스에 `design:paramtypes`를 방출하도록 **트리거**한다. 즉 `@Injectable()`이 없으면 NestJS는 그 클래스의 생성자 의존성을 못 읽는다. 오늘 배운 개념 3·4가 그 이유다.
- 실무 기술블로그 **"NestJS 환경에 맞는 Custom Decorator 만들기"**의 파라미터/메서드 데코레이터 부분은 정확히 `Reflect.defineMetadata`/`getMetadata` 왕복 위에 서 있다. 오늘 개념이 그 글의 전제다.
- 면접에서 "NestJS는 인터페이스로 DI가 안 되고 왜 클래스나 토큰을 써야 하나요?"라는 질문의 답이 아래 함정 2다.

---

## 흔한 실수와 함정

1. **`import 'reflect-metadata'` 누락.** 이 import가 없으면 `Reflect.defineMetadata`가 아예 함수로 존재하지 않아 `TypeError`가 난다. 애플리케이션 **진입점(엔트리)에서 딱 한 번** import하면 전역에 적용된다. 이 스테이지 파일들은 최상단에 이미 포함돼 있다.
2. **인터페이스 타입은 `design:paramtypes`로 못 읽는다.** 인터페이스는 컴파일 후 **완전히 사라지는** 순수 타입이라, 런타임 값이 없다. 생성자가 `constructor(repo: IUserRepository)`처럼 인터페이스를 받으면 `design:paramtypes`에는 `Object`만 찍힌다. 그래서 NestJS는 인터페이스 대신 **클래스**나 **주입 토큰(문자열/심볼) + `@Inject()`**를 쓴다.
3. **`emitDecoratorMetadata`를 안 켜고 `design:paramtypes`를 기대한다.** 이 옵션이 꺼져 있으면 타입 방출 자체가 일어나지 않는다.
4. **데코레이터 없는 순수 클래스에서 파라미터 타입을 기대한다.** 개념 4대로, 트리거 데코레이터가 없으면 메타데이터가 안 심긴다. 그래서 읽을 때 `?? []`로 없는 경우를 방어한다.

---

## 오늘 실습과의 연결

오늘 구현할 네 함수는 위 개념의 직접 실습이다(힌트 수준만):

- `setRole` / `getRole` — 개념 1의 `defineMetadata`/`getMetadata` 왕복. 키는 `'role'`. 없을 때 무엇을 돌려줄지만 정하면 된다.
- `@WithRole(role)` — 개념 2의 데코레이터 팩토리 버전.
- `getParamTypes(target)` — **오늘의 핵심**. `design:paramtypes`를 읽어 반환하되, 메타데이터가 없는 경우(함정 4)를 빈 배열로 방어해야 한다. 이 함수가 그대로 Day 4 컨테이너의 심장으로 들어간다.

막히면 20분 후 `solutions/`와 비교한다.

---

## 셀프 체크

1. `Reflect.defineMetadata`의 세 인자는 각각 무엇인가?
2. 정적 프로퍼티(`__tag__`) 방식 대비 `reflect-metadata`를 쓰는 이점 두 가지는?
3. `design:paramtypes`가 심기려면 어떤 두 조건이 필요한가?
4. 왜 인터페이스 타입은 생성자 주입에 쓸 수 없는가? NestJS는 대신 무엇을 쓰는가?
5. `import 'reflect-metadata'`를 빠뜨리면 어떤 증상이 나타나는가?
