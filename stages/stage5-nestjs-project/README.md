# Stage 5 — NestJS 미니 프로젝트 (레이어드 아키텍처)

인메모리 **Todo API**를 NestJS로 만들며, 프레임워크의 핵심 3요소
**Module / Controller / Provider**와 **레이어드 아키텍처**를 손에 익힌다.
스테이지 4에서 직접 만든 미니 DI가 NestJS에서 어떻게 "제품화"되어 있는지 연결해 이해한다.

---

## 1. NestJS 구조와 레이어드 아키텍처

NestJS 앱은 **모듈(Module)** 단위로 조립된다. 모듈은 두 가지를 선언한다.

- **Controller** — HTTP 요청/응답 담당. 라우팅 데코레이터(`@Get`, `@Post` …)로
  경로와 핸들러를 잇고, `@Param`/`@Body`로 요청 데이터를 꺼낸다. **얇게(thin)** 유지한다.
- **Provider** — DI 컨테이너에 등록되어 **주입 가능한** 것들(주로 `@Injectable` 서비스,
  그리고 커스텀 프로바이더로 등록한 저장소). 컨트롤러/서비스의 생성자로 주입된다.

요청은 계층을 따라 한 방향으로 흐른다.

```
   HTTP 요청 (GET /todos, POST /todos ...)
        │
        ▼
┌───────────────────┐
│  Controller       │   라우팅 · @Param/@Body 파싱 · 검증 위임 · 예외→HTTP 매핑
│  TodosController  │
└─────────┬─────────┘
          │ 호출 (비즈니스 로직 위임)
          ▼
┌───────────────────┐
│  Service          │   비즈니스 규칙 · 없는 id면 NotFoundException
│  TodosService     │
└─────────┬─────────┘
          │ 인터페이스(TodoRepository)에만 의존
          ▼
┌───────────────────┐
│  Repository       │   데이터 저장/조회 (여기선 인메모리 Map)
│  InMemoryTodoRepo │   ← DB 구현으로 갈아끼워도 상위 계층 무변경
└───────────────────┘
```

**핵심 포인트**

- 서비스는 `TodoRepository` **인터페이스**에만 의존한다. 인터페이스는 런타임에 사라지므로
  DI가 잡을 수 있도록 **인젝션 토큰**(`TODO_REPOSITORY` 문자열)을 두고,
  모듈에서 `{ provide: TODO_REPOSITORY, useClass: InMemoryTodoRepository }`로 바인딩한다.
- 이 "토큰 → 구현 바인딩"이 곧 **스테이지 4에서 만든 미니 DI의 register/resolve**와 같은 원리다.
  NestFactory가 생성자 파라미터를 읽어(`reflect-metadata`) 알아서 채워준다.

---

## 2. 채용 연관성

- 국내 주요 테크 기업의 Node.js 서버 공고 기술스택이 **"Node.js, TypeScript, Nest.js, Jest"**로 제시되는 경우가 많다.
- NestJS는 국내 Node.js 백엔드에서 사실상 표준 프레임워크로 자리잡았다.
- 이 스테이지는 공고 자격요건 **"TypeScript 기반 서버 개발 경험"**의 시작점이다.
  Module/Controller/Provider와 DI를 손으로 결선하고, Jest로 단위·e2e 테스트를 작성하는 것이
  실무 백엔드 루프의 최소 단위다.

---

## 3. 일차별 안내

| Day | 주제 | 파일 | 배우는 것 |
|-----|------|------|-----------|
| 1 | Module / Controller | `app.module.ts`, `todos.controller.ts` | `@Module`, `@Controller`, `@Get` 라우팅 |
| 2 | Service와 DI | `todos.service.ts` | `@Injectable`, 생성자 주입 (스테이지4 미니 DI와 동일 원리) |
| 3 | Repository · DTO | `todos.repository.ts`, `dto.ts` | 인터페이스 추상화 + 커스텀 프로바이더(useClass/토큰), `CreateTodoDto` 수동 검증 |
| 4 | 예외 처리 | `todos.service.ts`, `todos.controller.ts` | `NotFoundException`/`BadRequestException`, 404·400 흐름 |
| 5 | e2e | `tests/e2e.test.ts` | `Test.createTestingModule` + supertest로 CRUD 전체 검증 (실 포트 없이) |

---

## 4. 학습 노트 (실습 전 30분 이론)

"하루 이론 30분 + 실습 60~90분" 루틴에 맞춘 **일차별 전용 학습 노트**다.
각 일차 실습을 시작하기 **전에** 해당 노트를 먼저 읽는다. (노트는 답을 노출하지 않는다.)

| Day | 노트 | 핵심 주제 |
|-----|------|-----------|
| 1 | [Module / Controller](./notes/day1-module-controller.md) | NestJS 3요소, `@Module`/`@Controller`, 데코레이터 라우팅 |
| 2 | [Service와 DI](./notes/day2-service-di.md) | `@Injectable`·생성자 주입 (스테이지4 미니 DI와 동일 원리) |
| 3 | [Repository · DTO](./notes/day3-repository-dto.md) | 인터페이스 추상화, 인젝션 토큰·`useClass`, DTO 수동 검증 |
| 4 | [예외 처리](./notes/day4-exceptions.md) | HttpException 체계, `NotFoundException`→404 변환 흐름 |
| 5 | [e2e 테스트](./notes/day5-e2e.md) | `Test.createTestingModule` + supertest, CRUD 종합 검증 |

각 노트 구성: **학습 목표 → 개념 설명 → 실무·채용 연결 → 흔한 실수와 함정 → 오늘 실습과의 연결 → 셀프 체크**.

---

## 5. 진행 방법

각 일차는 **노트 읽기(이론 30분) → 실습(60~90분)** 순서로 진행한다.
① 위 표의 해당 Day 노트를 읽고 개념을 잡은 뒤,
② 아래 절차로 실습(exercises 구현·채점)을 진행한다.


### 채점 (테스트 실행)

```bash
# 내 답안(exercises) 채점 — 처음엔 대부분 실패한다
npm run check:stage5

# 정답(solutions) 기준 통과 확인
npm run check:stage5:answer
```

같은 테스트가 환경변수 `TARGET`에 따라 exercises / solutions 양쪽을 대상으로 돈다.
테스트는 항상 `@stage5/<모듈명>` 경로로 import 한다.

### 서버 부팅 후 curl 확인

```bash
# 3000 포트로 부팅 (solutions/main.ts)
npm run start:stage5
# → "Nest application successfully started on http://localhost:3000"

# 다른 터미널에서:
curl http://localhost:3000/todos
curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d "{\"title\":\"buy milk\"}"
curl http://localhost:3000/todos/1
curl -X PATCH http://localhost:3000/todos/1 -H "Content-Type: application/json" -d "{\"completed\":true}"
curl -X DELETE http://localhost:3000/todos/1
```

### 구현 순서 추천

1. `dto.ts` — `Todo`/DTO는 이미 있음, `validateCreateTodoDto` 본문 채우기
2. `todos.repository.ts` — `InMemoryTodoRepository` 5개 메서드
3. `todos.service.ts` — 저장소 위임 + `NotFoundException`
4. `todos.controller.ts` — 라우팅 핸들러 본문
5. `app.module.ts` — `controllers`/`providers` 배열 결선
6. `main.ts` — `NestFactory.create` + `listen(3000)`

> `exercises/`의 각 `throw new Error('TODO: ...')`를 실제 구현으로 바꾸면 된다.
> 스켈레톤도 strict 모드에서 **컴파일은 된다** — 런타임에서만 실패한다.
