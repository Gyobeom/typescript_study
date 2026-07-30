# Day 5 — e2e 테스트 (Test.createTestingModule + supertest)

> 이 노트는 **실습 전 30분 이론용**이다. 실습(Todo API)의 답은 담지 않는다.
> 예시 코드는 실습과 다른 도메인(도서관 `books`)으로 설명한다.

---

## 오늘의 학습 목표

1. **단위 테스트 vs e2e 테스트**의 차이와 각각이 무엇을 검증하는지 구분한다.
2. `Test.createTestingModule`이 실제 앱과 동일한 DI 그래프를 조립한다는 것을 이해한다.
3. **실제 포트를 열지 않고**(`app.getHttpServer()`) 요청을 흘려보내는 supertest의 동작을 안다.
4. CRUD 전체 흐름을 하나의 테스트 스위트로 검증하는 구조(`beforeAll`/`afterAll`)를 익힌다.
5. 상태코드(200/201/204/400/404)와 응답 바디를 어떻게 단언(assert)하는지 손에 익힌다.

---

## 개념 설명

### 1. 단위 테스트 vs e2e 테스트

지금까지(Day 2~4) 각 계층을 따로 검증했다면, 오늘은 **전 계층을 관통하는** 테스트를 쓴다.

| | 단위(unit) 테스트 | e2e 테스트 |
|--|------------------|-----------|
| 대상 | 한 클래스/함수 | HTTP 요청 → 응답 전 과정 |
| 범위 | 서비스만, 저장소만 | Controller→Service→Repository 전부 |
| 의존성 | 대개 mock으로 교체 | 실제 조립된 앱 그대로 |
| 답하는 질문 | "이 로직이 맞나" | "요청을 넣으면 기대한 응답이 나오나" |

e2e는 "부품이 아니라 **조립된 완성품**이 동작하는가"를 본다. 라우팅·DI·검증·예외 변환이 실제로 연결됐는지 한 번에 확인한다.

### 2. `Test.createTestingModule` — 테스트용 앱 조립

핵심은, e2e라고 해서 별도의 테스트 서버 코드를 쓰지 않는다는 것이다. **실제 `AppModule`을 그대로 조립**해 테스트한다.

```ts
// books.e2e.test.ts (예시 도메인)
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BooksModule } from './books.module';

describe('Books e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // 실제 모듈로 DI 그래프를 조립 (Day 1~4에서 만든 것 그대로)
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [BooksModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init(); // 앱을 초기화 (라우팅·프로바이더 준비)
  });

  afterAll(async () => {
    await app.close(); // 리소스 정리
  });

  // ... 테스트들 ...
});
```

- `Test.createTestingModule({ imports: [...] })` — 프로덕션과 **동일한 방식**으로 모듈을 조립한다. 여기서 커스텀 프로바이더 바인딩(Day 3)이 잘못됐으면 `.compile()` 단계에서 바로 터진다.
- `.compile()` — DI 그래프를 실제로 구성한다.
- `createNestApplication()` + `app.init()` — 앱 인스턴스를 만들고 초기화한다.
- `app.close()` — 테스트가 끝나면 반드시 정리한다.

> **스테이지 4 연결**: `.compile()`이 하는 일이 곧 스테이지 4에서 컨테이너가
> `resolve`로 의존성 그래프를 순회 조립하던 것과 같다. 테스트에서 조립이 실패하면,
> 프로덕션에서도 실패한다는 뜻이다. 그래서 e2e는 "결선이 맞았나"의 최종 확인이 된다.

### 3. supertest — 포트 없이 HTTP를 때린다

`request(app.getHttpServer())`가 핵심이다. **실제 3000 포트를 열지 않는다.** 대신 앱의 HTTP 핸들러에 요청을 **메모리 안에서 직접** 흘려보낸다.

```ts
it('GET /books 는 처음에 빈 배열', async () => {
  const res = await request(app.getHttpServer()).get('/books');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});
```

이 방식의 이점:

- **포트 충돌 없음** — 여러 테스트가 동시에 돌아도 포트를 안 쓴다.
- **빠름** — 네트워크 왕복이 없다.
- **격리** — 각 스위트가 자기 앱 인스턴스를 갖는다.

### 4. CRUD 전체 흐름 검증

e2e 스위트는 보통 CRUD의 성공·실패 경로를 한 줄씩 확인한다. 상태코드와 바디를 함께 단언하는 것이 핵심이다.

```ts
it('POST /books 는 201과 생성된 리소스를 반환', async () => {
  const res = await request(app.getHttpServer())
    .post('/books')
    .send({ title: 'Clean Code' });
  expect(res.status).toBe(201);                       // Day 1 라우팅 + HttpCode
  expect(res.body).toMatchObject({ title: 'Clean Code' }); // Day 2~3 로직
  expect(typeof res.body.id).toBe('number');          // 저장소 채번
});

it('POST /books 는 빈 title 에 400', async () => {
  const res = await request(app.getHttpServer())
    .post('/books')
    .send({ title: '' });
  expect(res.status).toBe(400);                       // Day 3 검증 + Day 4 변환
});

it('GET /books/:id 는 없으면 404', async () => {
  const res = await request(app.getHttpServer()).get('/books/99999');
  expect(res.status).toBe(404);                       // Day 4 예외 흐름
});
```

각 단언이 **어느 Day의 결과물을 검증하는지** 주석으로 표시했다. e2e는 Day 1~4를 한꺼번에 되짚는 **종합 시험**인 셈이다.

- `res.status` — HTTP 상태코드. 201(생성)/204(삭제)/400/404를 정확히 본다.
- `res.body` — JSON 응답. `toEqual`(정확히 일치) vs `toMatchObject`(부분 일치)를 상황에 맞게.
- `.send({...})` — 요청 바디를 JSON으로 보낸다.

### 5. 왜 `beforeAll`에서 앱을 한 번만 조립하나

`beforeAll`은 스위트 전체에서 **한 번만** 실행된다. 앱 조립은 비용이 있으니 매 테스트마다 다시 만들지 않는다. 다만 이 경우 **테스트 간 상태가 공유**된다(인메모리 저장소가 계속 쌓인다). 그래서 테스트를 짤 때 "앞 테스트가 남긴 데이터"를 고려하거나, 각 테스트가 자기 데이터를 새로 만들어 쓰도록 작성한다.

---

## 실무·채용 연결

- 서버 공고 기술스택에 함께 등장하는 **"Jest"**가 바로 이것이다. NestJS + Jest로 **단위 + e2e 테스트를 작성하는 것**이 실무 백엔드 루프의 마지막 조각이다.
- 실무에서 e2e 테스트는 **회귀 방지**의 핵심이다. 코드를 고쳐도 "요청→응답 계약"이 안 깨졌는지 자동으로 확인해준다. PR마다 e2e가 도는 팀이 많다.
- 면접에서 **"단위 테스트와 통합/e2e 테스트의 차이"**, **"테스트에서 의존성을 어떻게 다루나(mock vs 실제)"**는 단골 질문이다. `Test.createTestingModule`로 실제 그래프를 조립하는 것과, 특정 프로바이더만 가짜로 교체(override)하는 것의 차이를 설명할 수 있으면 좋다.

---

## 흔한 실수와 함정

1. **`app.close()` 누락 → 프로세스가 안 끝남** — `afterAll`에서 앱을 닫지 않으면 열린 핸들이 남아 Jest가 "did not exit" 경고를 내거나 멈추지 않는다. 반드시 정리한다(스테이지 4에서 컨테이너 `clear()`로 뒷정리하던 습관과 같다).

2. **`reflect-metadata` import 누락** — 테스트 파일 최상단에도 `import 'reflect-metadata'`가 필요하다. 없으면 DI 메타데이터를 못 읽어 `.compile()`이 실패한다.

3. **상태코드를 안 보고 바디만 확인** — `res.body`만 단언하면, 실수로 500이 나도 통과할 수 있다(에러 바디도 객체다). **`res.status`를 먼저 단언**하는 습관을 들인다.

4. **테스트 간 상태 공유를 잊음** — `beforeAll`로 한 번만 조립하면 인메모리 저장소가 누적된다. "GET /books가 빈 배열"을 기대하는 테스트가 뒤 순서에 있으면 이미 데이터가 쌓여 실패한다. 각 테스트가 **자기 리소스를 만들어 그 id로 검증**하도록 짜면 안전하다.

---

## 오늘 실습과의 연결 (힌트만)

- 실습 e2e는 `AppModule`을 `imports`로 조립하고, CRUD 각 경로의 **상태코드와 바디**를 순서대로 확인한다. 위 예시의 `books`를 실습 도메인으로 바꿔 읽으면 구조가 그대로 보인다.
- 테스트가 빨간불이면, **어느 Day의 결과물이 문제인지** 상태코드로 역추적하라: 404가 안 나오면 Day 4 예외, 400이 안 나오면 Day 3 검증+Day 4 변환, 아예 404가 뜨는데 라우팅 문제 같으면 Day 1 모듈 등록을 의심한다.
- `.compile()` 단계에서 터지면 로직이 아니라 **결선(DI/프로바이더 등록)** 문제다. Day 2·3의 "등록 누락" 함정을 다시 확인하라.

---

## 셀프 체크

1. 단위 테스트와 e2e 테스트가 각각 답하는 질문을 한 문장씩으로 구분해보라.
2. `Test.createTestingModule`로 조립한 앱이 프로덕션 앱과 "같은 것"이라고 말할 수 있는 이유는?
3. `request(app.getHttpServer())`가 실제 포트를 열지 않는데도 HTTP를 테스트할 수 있는 원리는?
4. `afterAll`에서 `app.close()`를 빠뜨리면 어떤 증상이 나타나는가?
5. e2e 테스트가 404를 기대하는데 200이 온다면, Day 1~4 중 어디를 먼저 의심해야 하는가?
