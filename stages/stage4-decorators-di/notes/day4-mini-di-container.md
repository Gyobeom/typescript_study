# Day 4~5 — 미니 DI(의존성 주입) 컨테이너

> 이론 60분용 노트 (이틀 분량). 오늘 실습(`exercises/day4-mini-di-container.ts`) **전에** 읽는다.
> 전제: Day 1(팩토리·마커), Day 2(감싸기), **Day 3(`design:paramtypes`)** — 특히 Day 3이 이 스테이지의 재료다.

이 노트는 지난 3일의 조각을 모아 **NestJS IoC 컨테이너의 축소판**을 직접 짓는 개념을 다룬다. 스테이지 4의 클라이맥스이며, 이틀에 걸쳐 소화한다. **Day 4는 아래 1~5장(IoC/DI 개념 + 컨테이너의 원리)**, **Day 5는 6~8장(재귀 resolve·싱글턴·엣지케이스)**을 중심으로 읽으면 흐름이 맞다.

---

## 오늘의 학습 목표

1. **IoC(제어의 역전)**와 **DI(의존성 주입)**를 구분해서 설명할 수 있다.
2. **생성자 주입**이 무엇이고, 왜 "필드를 직접 `new` 하는 것"보다 나은지 안다.
3. 컨테이너의 `resolve`가 어떻게 **`design:paramtypes`를 읽어 의존성을 알아내는지** 그린다.
4. **재귀 resolve**로 3단(Repo ← Service ← Controller) 체인이 관통되는 과정을 손으로 추적할 수 있다.
5. **싱글턴 캐싱**의 원리와, 그것이 "의존성 공유"를 어떻게 만드는지 이해한다.
6. `@Injectable()`이 "마법이 아니라 마커 + 타입 방출 트리거"임을 자기 말로 설명한다.

---

## 1. IoC와 DI — 용어부터 정리

### 1-1. 제어의 역전 (IoC, Inversion of Control)

보통 코드는 필요한 걸 **자기가 직접 만든다**:

```typescript
class OrderService {
  private mailer = new SmtpMailer();     // ← 내가 직접 만든다
  private repo = new PostgresOrderRepo(); // ← 이것도 직접
}
```

문제:
- `OrderService`가 `SmtpMailer`라는 **구체 구현에 못박혀** 있다. 테스트에서 가짜 메일러로 바꿀 수 없다.
- 의존성 생성 순서·설정을 서비스가 다 떠안는다.

**제어의 역전**은 이 "만드는 책임"을 **바깥(컨테이너)**에 넘기는 것이다. 서비스는 "나는 메일러가 필요하다"고 **선언만** 하고, 실제로 무엇을 언제 만들지는 컨테이너가 정한다. 제어의 방향이 뒤집힌다("내가 부른다" → "누가 나에게 넣어 준다"). 이 아이디어를 흔히 **할리우드 원칙**("먼저 연락하지 마세요, 저희가 연락드릴게요")이라 부른다.

### 1-2. 의존성 주입 (DI, Dependency Injection)

IoC를 구현하는 **구체적 방법**이 DI다. 필요한 의존성을 바깥에서 **넣어 준다(inject)**. 주입 방식은 여러 가지지만, NestJS와 이 스테이지가 쓰는 건 **생성자 주입**이다:

```typescript
class OrderService {
  constructor(
    private mailer: Mailer,       // ← 밖에서 넣어 준다
    private repo: OrderRepository, // ← 이것도
  ) {}
}
```

`OrderService`는 이제 누가 어떤 메일러를 주는지 모른다(알 필요도 없다). 테스트에선 가짜를 넣고, 운영에선 진짜를 넣는다. **의존 대상이 "구체 클래스"에서 "생성자 파라미터"로 빠져나온 것** — 이게 DI의 핵심 효과다.

> **IoC ⊃ DI**: IoC는 넓은 원칙(제어를 밖으로 넘김), DI는 그중 "의존성을 주입해서" 실현하는 구체 기법이다. 면접에서 둘을 구분해 말하면 좋다.

### 1-3. 그럼 "누가 주입하나?" → 컨테이너

의존성을 넣어 주려면, 누군가 (1) 어떤 클래스가 무엇을 필요로 하는지 알고, (2) 그 의존성들을 만들어서, (3) 생성자에 꽂아 줘야 한다. 그 "누군가"가 **IoC 컨테이너**다. 오늘 우리가 만드는 게 바로 그것이다.

---

## 2. 컨테이너가 풀어야 할 문제

`container.resolve(UserController)` 한 줄을 호출하면, 컨테이너는 다음을 알아서 해야 한다:

1. `UserController`는 무엇을 필요로 하는가? → **`design:paramtypes`를 읽는다** (Day 3의 결과물!).
2. 그 의존성(`UserService`)은 또 무엇을 필요로 하는가? → **재귀적으로** 같은 질문을 반복한다.
3. 맨 밑(`UserRepository`, 의존성 없음)에 도달하면 인스턴스를 만들고, 위로 올라오며 조립한다.
4. 한 번 만든 인스턴스는 **재사용**한다(싱글턴).

즉 컨테이너 = "**타입 메타데이터를 읽어 → 의존성 트리를 재귀로 훑고 → 아래에서 위로 조립하며 → 캐싱하는** 기계"다.

---

## 3. `@Injectable()` — 마커이자 방출 트리거

컨테이너가 관리할 클래스에는 `@Injectable()`을 붙인다. 이 데코레이터가 하는 일은 딱 두 가지다(Day 1·3의 종합):

```typescript
function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('injectable', true, target); // ① "관리 가능" 마커를 심는다
  };
}
```

- ① **마커 심기**: "이 클래스는 컨테이너가 생성·관리해도 된다"는 표식. 컨테이너는 `resolve` 시 이 표식이 없으면 거부한다(아무 클래스나 막 만들지 않기 위해).
- ② **타입 방출 트리거**: `@Injectable()`이 붙는 것 자체가 컴파일러에게 "이 클래스에 `design:paramtypes`를 심어라"는 신호다(Day 3 개념 4). 이게 없으면 컨테이너가 생성자 의존성을 읽을 수 없다.

**그래서 `@Injectable()`은 "마법"이 아니다.** 인자 없는 마커 데코레이터 하나가 (1) 표식과 (2) 타입 방출이라는 두 스위치를 켤 뿐이다. 이 문장을 자기 말로 할 수 있으면 이 스테이지의 목표를 절반 이상 달성한 것이다.

> 실습에서 `@Injectable()`은 **완성형으로 제공**된다. 이유: 예제 도메인 클래스들이 로드되는 즉시 이 데코레이터가 호출되므로(팩토리는 정의 시 실행, Day 1 개념 3), 여기서 `throw`하면 파일 자체를 열 수 없기 때문이다. 학습자가 채우는 핵심은 `isInjectable`과 `Container.resolve`다.

---

## 4. `resolve` 알고리즘 — 한 단계씩

의존성 없는 클래스부터 보자. 컨테이너의 `resolve`가 하는 일을 의사코드로:

```
resolve(Cls):
  1. 캐시에 Cls 가 있으면 → 그걸 반환하고 끝  (싱글턴)
  2. Cls 가 @Injectable 이 아니면 → 에러
  3. paramTypes ← design:paramtypes 를 읽는다 (없으면 [])
  4. deps ← paramTypes 의 각 타입을 resolve(재귀!) 한 결과
  5. instance ← new Cls(...deps)
  6. 캐시에 instance 저장
  7. instance 반환
```

의존성 없는 클래스(`UserRepository`)라면 3에서 `paramTypes`가 `[]`, 4에서 `deps`가 `[]`, 5에서 `new UserRepository()`로 끝난다. 가장 단순한 경우다.

**2번(마커 확인)이 왜 필요한가:** 컨테이너가 아무 클래스나 만들면 안 된다. `@Injectable`을 명시적으로 붙인 클래스만 관리 대상으로 삼아, 실수로 엉뚱한 걸 주입하는 걸 막는다. 실습 테스트에도 "마커 없는 클래스를 resolve하면 에러"가 있다.

---

## 5. 재귀 resolve — 3단 체인 손으로 추적하기

이제 핵심. `UserRepository ← UserService ← UserController` 체인에서 `resolve(UserController)`를 부르면 어떻게 될까. 스택을 손으로 그려 보자.

```
resolve(UserController)
  ├─ 캐시 없음, @Injectable OK
  ├─ paramTypes = [UserService]
  ├─ deps = [ resolve(UserService) ]  ← 여기서 재귀!
  │        resolve(UserService)
  │          ├─ 캐시 없음, @Injectable OK
  │          ├─ paramTypes = [UserRepository]
  │          ├─ deps = [ resolve(UserRepository) ]  ← 또 재귀!
  │          │        resolve(UserRepository)
  │          │          ├─ 캐시 없음, @Injectable OK
  │          │          ├─ paramTypes = []          ← 바닥 도달
  │          │          ├─ new UserRepository()      ← ★ 최하위부터 생성
  │          │          └─ 캐시에 저장 후 반환
  │          ├─ new UserService(repo)                ← repo 를 주입
  │          └─ 캐시에 저장 후 반환
  ├─ new UserController(service)                     ← service 를 주입
  └─ 캐시에 저장 후 반환
```

관찰:
- 생성은 **맨 아래(Repository)부터** 일어난다. 위 클래스는 아래가 다 만들어져야 조립되기 때문이다.
- 각 단계에서 `design:paramtypes`(Day 3)가 "다음에 무엇을 만들지"를 알려 준다. 이 메타데이터가 없으면 재귀가 한 발짝도 못 나간다.
- 재귀의 **종료 조건**은 "의존성 없는 클래스"(paramTypes가 `[]`)다. 여기서 재귀가 멈추고 위로 되돌아온다.

이 재귀 한 판이 NestJS가 앱 부팅 시 수백 개 프로바이더를 조립하는 원리의 축소판이다.

---

## 6. 싱글턴 캐싱 — 왜, 어떻게

### 6-1. 왜 캐싱하나

같은 `UserRepository`를 여러 서비스가 주입받는다면, 매번 새로 만들 이유가 없다(오히려 DB 커넥션 풀 같은 자원이 중복 생성돼 문제가 된다). 그래서 컨테이너는 **한 번 만든 인스턴스를 캐시에 저장**하고, 다음에 같은 클래스를 요청하면 캐시된 걸 돌려준다. 이게 **싱글턴 스코프**다. NestJS의 기본 스코프도 싱글턴이다.

### 6-2. 어떻게 — 캐시는 `Map<클래스, 인스턴스>`

```typescript
private readonly singletons = new Map<Constructor, unknown>();
```

키가 **클래스(생성자 함수) 자체**라는 점이 중요하다. 문자열 이름이 아니라 클래스 참조를 키로 쓰므로, 같은 클래스면 정확히 같은 캐시 엔트리를 가리킨다. `resolve` 1번(캐시 조회)과 6번(캐시 저장)이 이 Map을 쓴다.

### 6-3. 캐싱이 만드는 "의존성 공유"

캐싱은 성능 최적화만이 아니다. **같은 인스턴스가 공유되도록** 보장한다. 예:

```
resolve(UserService)    → service_A 생성, 캐시 저장
resolve(UserController) → paramTypes=[UserService]
                          → resolve(UserService)  ← 캐시 적중! service_A 반환
                          → new UserController(service_A)
```

따라서 "직접 resolve한 `UserService`"와 "`UserController` 안에 주입된 `UserService`"가 **정확히 같은 인스턴스**다. 실습 테스트의 `controller.getService() === service`가 이걸 검증한다. 만약 캐싱이 없다면 둘은 다른 인스턴스가 되어, 상태를 공유하지 못한다.

### 6-4. `has` / `clear`

- `has(Cls)` — 캐시에 이미 인스턴스가 있는지(싱글턴 확인용).
- `clear()` — 캐시를 비운다. 테스트 격리·재구성에 쓴다. 매 테스트가 새 `Container`를 쓰거나 `clear`로 초기화해야 이전 테스트의 인스턴스가 새어 들어오지 않는다.

---

## 7. 전체 그림 — 4일이 하나로

| 조각 | 어디서 배웠나 | 컨테이너에서의 역할 |
|---|---|---|
| 데코레이터 = 함수, 팩토리 | Day 1 | `@Injectable()`이 팩토리·마커 |
| 감싸기(참고) | Day 2 | (AOP 확장 시) 프록시로 관점 주입 |
| `defineMetadata` 마커 | Day 3 | `@Injectable`이 "관리 가능" 표식 심기 |
| **`design:paramtypes`** | Day 3 | **resolve가 의존성을 알아내는 열쇠** |
| 재귀 resolve | Day 4~5 | 의존성 트리를 아래→위로 조립 |
| 싱글턴 캐싱 | Day 4~5 | 인스턴스 재사용·공유 |

---

## 실무·채용 연결

- **NestJS DI가 정확히 이것이다.** `@Module`의 `providers`에 클래스를 등록하면, NestJS 컨테이너가 부팅 때 각 프로바이더를 `design:paramtypes` 기반 재귀 resolve로 조립하고 싱글턴으로 캐싱한다. 오늘 만든 컨테이너의 확장판(스코프·순환 의존 감지·모듈 경계·주입 토큰 추가)일 뿐이다.
- **면접 단골**: "NestJS DI가 내부적으로 어떻게 동작하나요?"에 대해, 오늘 손으로 만든 경험이 있으면 `@Injectable`의 두 역할, `design:paramtypes`, 재귀 resolve, 싱글턴 스코프를 자기 말로 설명할 수 있다. 이건 암기가 아니라 구현 경험에서 나온다.
- 국내 테크 기업 **`NestJS AOP 라이브러리`**나 커스텀 데코레이터 글도, 결국 이 컨테이너가 관리하는 인스턴스에 관점을 주입하는 것이므로 오늘 그림 위에 얹힌다.

---

## 흔한 실수와 함정

1. **재귀 종료 조건을 놓쳐 무한 루프.** `paramTypes`가 빈 클래스에서 재귀가 멈춰야 한다. (실제 순환 의존, 예: A→B→A는 이 미니 컨테이너에선 스택 오버플로가 난다. NestJS는 이걸 감지해 에러를 내거나 `forwardRef`로 푼다 — 오늘 범위 밖이지만 존재는 알아둔다.)
2. **`import 'reflect-metadata'` 누락.** `design:paramtypes`를 읽으려면 필수. 없으면 `getMetadata`가 함수로 존재하지 않는다. 진입점에서 한 번(Day 3 함정 1).
3. **인터페이스를 생성자에 주입하려 한다.** 인터페이스는 런타임에 사라져 `design:paramtypes`에 `Object`로 찍힌다(Day 3 함정 2). 실습 도메인이 전부 **클래스**인 이유가 이것. 실무에선 토큰 + `@Inject()`로 우회한다.
4. **싱글턴 키를 이름 문자열로 삼는다.** 이름은 충돌·리팩터에 취약하다. 클래스 참조 자체를 Map 키로 써야 안전하다(개념 6-2).
5. **테스트 격리를 안 해 캐시가 새어 든다.** 매 테스트에 새 `Container`를 만들거나 `clear()`하지 않으면 이전 인스턴스가 남아 결과가 뒤섞인다.
6. **`@Injectable` 없는 클래스도 resolve될 거라 기대.** 마커 확인(resolve 2번)에서 막혀 에러가 정상이다.

> ⚠️ **주의(레거시 vs 표준):** 이 컨테이너의 자동 의존성 추론은 `experimentalDecorators` + `emitDecoratorMetadata`(레거시 데코레이터)에 100% 의존한다. TC39 표준 데코레이터에는 `design:paramtypes` 자동 방출이 없어, 같은 방식의 자동 생성자 주입이 성립하지 않는다.

---

## 오늘 실습과의 연결

오늘(이틀에 걸쳐) 구현할 것은 위 알고리즘의 직접 실현이다(힌트 수준만):

- `isInjectable(target)` — 개념 3의 마커를 읽는 짝. `resolve` 2번에서 쓰인다.
- `Container.resolve` — 4장 의사코드 7단계가 그대로 뼈대다. **캐시 조회 → 마커 확인 → paramTypes 읽기 → 각 의존성 재귀 resolve → new 생성 → 캐시 저장** 순서. 재귀(개념 5)와 캐싱(개념 6)이 모두 여기서 만난다.
- `has` / `clear` — 6-4의 캐시 조회·비우기. 싱글턴 검증과 테스트 격리에 쓰인다.

Day 4에 `isInjectable` + `resolve`의 뼈대(의존성 없는 클래스 생성까지)를 세우고, Day 5에 3단 재귀·싱글턴 공유·엣지케이스를 다지는 흐름을 권한다. 막히면 20분 후 `solutions/`와 비교한다.

---

## 셀프 체크

1. IoC와 DI의 차이를 한 문장씩으로 설명하라. 어느 쪽이 더 넓은 개념인가?
2. 생성자 주입이 `필드에서 직접 new` 하는 것보다 테스트에 유리한 이유는?
3. `resolve`의 7단계를 순서대로 말해 보라. 어느 단계에서 재귀가 일어나는가?
4. 3단 체인에서 인스턴스는 어느 클래스부터(위/아래) 생성되는가? 왜인가?
5. 싱글턴 캐시가 없다면 `controller.getService() === service` 테스트는 왜 실패하는가?
6. 캐시 Map의 키로 클래스 이름 문자열 대신 클래스 참조를 쓰는 이유는?
7. `@Injectable()`이 하는 두 가지 일을 말하고, 왜 이게 "마법"이 아닌지 설명하라.
