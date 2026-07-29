# Day 5 학습 노트 — 종합: 계약 기반 설계

> 이론 30분용 노트. 다 읽고 나서 `exercises/day5-contract-design.ts`를 연다.
> 이번 주 배운 걸 한 자리에 모으는 날이다. 예시 도메인은 실습(결제 체크아웃)과 다르게 **회원가입 파이프라인**으로 잡았다.

---

## 오늘의 학습 목표

1. 하나의 서비스가 **여러 계약에만 의존**하도록 설계하는 감각을 익힌다.
2. 계약별 **교체 가능한 구현체**(실동작용/제한용/테스트용)를 나눠 만든다.
3. **DIP를 실전 규모**로 적용한다 — 구체를 전혀 모르는 서비스 짜기.
4. 여러 단계 흐름에서 **early return(조기 종료)** 으로 부작용을 막는 순서 설계를 한다.
5. 이 구조가 **NestJS 서비스 레이어의 축소판**임을 이해한다.

---

## 개념 설명

### 1. 계약 기반 설계란

지금까지 배운 걸 조립하면 하나의 그림이 된다:

- **Day1** 계약(interface)에 의존 → **Day3** 협력자를 조합으로 주입 → **Day4** 추상에 의존(DIP).

이걸 한 서비스에 모으면, **여러 협력자를 각각의 계약으로 주입받아 조율하는 서비스**가 된다. 서비스는 구체 구현을 하나도 모른다.

```ts
// 세 협력자를 "계약"으로 정의
interface PasswordHasher { hash(raw: string): string; }
interface UserRepository { exists(email: string): boolean; save(email: string, pw: string): void; }
interface Mailer        { send(to: string, body: string): void; }

// 서비스는 세 계약에만 의존한다 (구체 클래스 전혀 모름)
class SignupService {
  constructor(
    private readonly hasher: PasswordHasher,
    private readonly repo: UserRepository,
    private readonly mailer: Mailer,
  ) {}

  signup(email: string, rawPw: string): { ok: boolean; reason: string } {
    // (1) 중복 검사 — 실패면 이후 단계 없이 즉시 종료
    if (this.repo.exists(email)) {
      return { ok: false, reason: '이미 가입된 이메일' };
    }
    // (2) 저장
    this.repo.save(email, this.hasher.hash(rawPw));
    // (3) 환영 메일
    this.mailer.send(email, '가입을 환영합니다');
    return { ok: true, reason: '가입 완료' };
  }
}
```

`SignupService`는 비밀번호를 어떻게 해싱하는지, DB가 뭔지, 메일을 어떻게 보내는지 **전혀 모른다**. 오직 세 계약만 안다.

### 2. 교체 가능한 구현체 — 상황별로 갈아끼운다

같은 계약을 여러 방식으로 구현해 상황에 맞게 주입한다.

```ts
// 실동작용
class BcryptHasher implements PasswordHasher { hash(raw: string) { return realBcrypt(raw); } }
// 테스트/데모용 — 검증이 쉽도록 단순하게
class FakeHasher implements PasswordHasher { hash(raw: string) { return `hashed(${raw})`; } }

// 프로덕션
new SignupService(new BcryptHasher(), realRepo, realMailer);
// 테스트 — 무엇이 저장/발송됐는지 검증 가능한 가짜들
new SignupService(new FakeHasher(), fakeRepo, spyMailer);
```

서비스 코드는 **한 줄도 안 바뀐다.** 무엇을 주입하느냐만 다르다. 이게 계약 기반 설계의 힘이다 — "테스트 가능성"과 "교체 가능성"을 공짜로 얻는다.

### 3. 흐름 설계 — early return으로 부작용 격리

여러 단계가 순서대로 실행되는 서비스에서 가장 중요한 건 **"실패하면 그 뒤 동작을 하지 않는다"** 는 순서다.

```ts
signup(email, rawPw) {
  if (this.repo.exists(email)) {
    return { ok: false, reason: '이미 가입된 이메일' }; // ← 여기서 끝. save/send 안 함
  }
  this.repo.save(...);   // 위를 통과해야만 도달
  this.mailer.send(...); // save 성공 후에만 도달
  return { ok: true, ... };
}
```

만약 early return 없이 흐름을 이어가면, 중복 이메일인데도 저장을 시도하거나 메일을 보내는 **엉뚱한 부작용**이 생긴다. 각 검문소에서 실패 시 `return`으로 즉시 빠져나가는 게 핵심이다.

> 테스트가 검증하는 지점이 바로 이것이다: "실패 케이스에서 **부작용이 안 일어났는지**"(저장 안 됨, 메일 안 감).

### 4. 구조적 타이핑의 보너스 — 즉석 가짜

TypeScript는 구조적 타이핑(Day1)이므로, 계약을 만족하는 **즉석 객체**를 클래스 없이 만들 수 있다.

```ts
const spyMailer: Mailer = { send: (to, body) => sentBox.push({ to, body }) };
new SignupService(new FakeHasher(), fakeRepo, spyMailer);
```

`class`를 새로 정의하지 않고 객체 리터럴만으로 계약을 채웠다. 테스트에서 협력자를 가짜로 꽂을 때 이 방식이 매우 유용하다. **"계약에만 의존하면, 그 계약을 채우는 어떤 것이든 받아들여진다"** 는 DIP의 실용적 결실이다.

---

## 실무·채용 연결

- 이 `SignupService` 구조가 **NestJS 서비스 레이어 그 자체**다. 컨트롤러가 서비스를, 서비스가 리포지토리/게이트웨이/메일러를 계약으로 주입받는다. 실제 구현은 DI 컨테이너가 꽂아준다.
- "서비스 하나를 설계해보라"는 과제형 면접에서, **협력자를 계약으로 주입받는 서비스**를 그리면 설계 소양이 바로 드러난다.
- 실패 경로의 부작용 격리(early return)는 **결제·주문처럼 돈이 오가는 도메인**에서 특히 중요하다. "재고가 없는데 결제가 됐다" 같은 버그가 여기서 갈린다. 국내 테크 기업/국내 테크 기업급 백엔드가 정확성에 민감한 이유다.
- 이번 주의 조합/DIP는 stage4의 **미니 DI 컨테이너**로 이어진다. 오늘 손으로 주입한 것을, 그때는 컨테이너가 자동으로 해준다.

---

## 흔한 실수와 함정

1. **서비스가 구체 클래스를 직접 `new`함** — 서비스 안에서 협력자를 생성하면 DIP가 깨지고 테스트에서 갈아끼울 수 없다. 전부 **생성자 주입**으로 받아라.
2. **실패 후에도 흐름이 이어짐** — early return을 빠뜨리면 실패 케이스에서 저장/알림 같은 부작용이 새어 나간다. 각 검문소마다 확실히 종료하라.
3. **단계 순서 뒤바뀜** — "먼저 검사 → 그다음 실행 → 마지막 알림" 순서가 어긋나면, 실패했는데 알림이 먼저 나가는 식의 버그가 생긴다. 주석의 번호 순서를 그대로 지켜라.
4. **주입 타입을 구체로** — 이번 주 내내 반복된 함정. 세 협력자 모두 **인터페이스 타입**으로 받아야 즉석 가짜가 통한다.
5. **성공/실패 반환 형식 불일치** — 결과 객체의 필드명·메시지 문자열이 계약과 어긋나면 사용처와 테스트가 깨진다.

---

## 오늘 실습과의 연결

`exercises/day5-contract-design.ts`는 세 계약(결제/재고/알림)에만 의존하는 서비스를 완성하는 종합 문제다.

- 위 `SignupService`의 구도가 그대로 대응된다. 서비스는 세 협력자를 **인터페이스 타입**으로 주입받고, 구체 구현을 전혀 몰라야 한다.
- 각 계약마다 **교체 가능한 구현체**를 만든다: 항상 성공하는 것, 조건부로 실패하는 것(한도), 테스트에서 결과를 모아 확인하는 것. 위의 `BcryptHasher`/`FakeHasher`/`spyMailer` 3분법과 같은 발상이다.
- 서비스 흐름은 "재고 확인 → 결제 → (성공 시) 재고 차감 + 알림"이다. **각 실패 지점에서 early return**으로 이후 부작용을 막는 게 채점 포인트다(함정 2번). 실패했는데 재고가 줄거나 알림이 가면 틀린 것이다.
- 성공 시 알림 메시지의 형식(수치 포함)은 주석에 정확히 나와 있다. 문자열을 토씨까지 맞춰라.
- 테스트 중에는 **클래스 없이 객체 리터럴로 만든 가짜 협력자**를 주입하는 케이스가 있다(위 3.4절). 네 서비스가 계약에만 의존하면 그것도 자동으로 통과한다.

---

## 셀프 체크

1. 하나의 서비스가 여러 협력자를 "계약으로 주입받는다"는 게 왜 테스트를 쉽게 만드는가?
2. 실패 케이스에서 early return을 빠뜨리면 구체적으로 어떤 버그가 생기는가? 예를 들어보라.
3. 클래스를 정의하지 않고 객체 리터럴만으로 계약을 만족시킬 수 있는 이유는? (키워드: 구조적 타이핑)
4. 이 구조가 NestJS 서비스 레이어와 어떻게 대응되는지 설명하라.
5. 이번 주 Day1~4에서 배운 개념이 오늘 서비스의 어느 부분에 각각 쓰였는지 짚어보라.
