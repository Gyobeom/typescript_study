# Day 1 — Module와 Controller (NestJS의 뼈대)

> 이 노트는 **실습 전 30분 이론용**이다. 실습(Todo API)의 답은 담지 않는다.
> 예시 코드는 실습과 다른 도메인(도서관 `books`)으로 설명한다.

---

## 오늘의 학습 목표

1. NestJS 앱이 **Module / Controller / Provider** 3요소로 조립된다는 것을 이해한다.
2. `@Module({ controllers, providers })` 메타데이터가 "무엇을 조립할지" 선언하는 방식임을 안다.
3. `@Controller('경로')` + `@Get`/`@Post` 라우팅 데코레이터로 URL과 메서드를 잇는 흐름을 손에 익힌다.
4. 컨트롤러를 **얇게(thin)** 유지한다는 레이어드 아키텍처의 첫 원칙을 설명할 수 있다.
5. 요청이 `HTTP → Controller` 로 들어와 어디로 흘러가는지 그림을 그린다.

---

## 개념 설명

### 1. NestJS의 3요소

NestJS 애플리케이션은 세 종류의 부품으로 이루어진다. 이 셋의 관계를 먼저 머릿속에 넣어야 나머지가 전부 쉬워진다.

| 요소 | 데코레이터 | 역할 | 한 줄 정의 |
|------|-----------|------|-----------|
| **Module** | `@Module` | 조립 설명서 | "이 앱은 어떤 컨트롤러와 프로바이더를 갖는가" |
| **Controller** | `@Controller` | HTTP 입출력 | 요청을 받아 파싱하고, 로직은 남에게 위임 |
| **Provider** | `@Injectable` 등 | 주입 가능한 부품 | 서비스·저장소처럼 DI로 꽂히는 것 (Day2~3) |

오늘은 이 중 **Module과 Controller** 두 개에 집중한다. Provider(서비스)는 내일이다.

### 2. Module — 앱의 조립 설명서

Nest 앱은 클래스 하나에 `@Module` 데코레이터를 붙여 정의한다. 이 데코레이터의 인자는 **메타데이터 객체**다. "무엇을 실행하라"가 아니라 "이 모듈은 무엇을 갖는가"를 **선언**한다.

```ts
// books.module.ts (예시 도메인 — 도서관)
import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';

@Module({
  controllers: [BooksController], // 이 모듈이 가진 컨트롤러들
  providers: [],                  // 주입 가능한 부품들 (내일 채운다)
})
export class BooksModule {}
```

핵심은 `@Module`이 **선언적(declarative)**이라는 것이다. 배열에 클래스를 나열하면, Nest가 앱을 부팅할 때 그 목록을 읽어 라우팅을 등록하고 DI 그래프를 만든다. 우리가 `new BooksController()`를 직접 호출하지 않는다 — 그건 프레임워크의 몫이다.

> **스테이지 4 연결**: 스테이지 4의 `Container`도 클래스를 "등록"하고 나중에 "resolve"했다.
> `@Module`의 `providers` 배열이 바로 그 **등록 목록**의 NestJS판이다. 등록해두면
> 프레임워크가 필요할 때 꺼내 조립한다는 발상이 똑같다.

### 3. Controller — HTTP 요청/응답 담당

컨트롤러는 **바깥세상(HTTP)과 앱을 잇는 경계**다. URL 경로를 클래스와 메서드에 연결하는 것이 전부이며, 실제 일은 하지 않는다.

```ts
// books.controller.ts (예시 도메인)
import { Controller, Get } from '@nestjs/common';

@Controller('books') // 이 컨트롤러의 모든 경로 앞에 /books 가 붙는다
export class BooksController {
  @Get() // GET /books
  findAll(): string {
    return 'all books';
  }

  @Get('featured') // GET /books/featured
  featured(): string {
    return 'featured books';
  }
}
```

- `@Controller('books')` — 이 클래스가 담당하는 **경로 접두사**. 여기 붙는 모든 핸들러는 `/books`로 시작한다.
- `@Get()` — 인자 없는 `@Get`은 접두사 그 자체(`GET /books`)에 매핑된다.
- `@Get('featured')` — 접두사 뒤에 세그먼트가 붙어 `GET /books/featured`가 된다.

### 4. 데코레이터 기반 라우팅이라는 발상

전통적 프레임워크(Express)에서는 `app.get('/books', handler)`처럼 라우팅을 **명령형 코드**로 등록한다. NestJS는 이걸 **데코레이터 메타데이터**로 바꿨다.

```
@Get('featured')     ← 이 메타데이터를
featured() {...}        Nest가 부팅 시 읽어서

  ⇩ 내부적으로

router.get('/books/featured', featured 를 감싼 핸들러)
```

즉 데코레이터는 "라우팅 표"에 한 줄을 등록하는 **선언**이다. 스테이지 4에서 `@Injectable()`이 클래스에 `reflect-metadata`로 표식을 남기고, 나중에 `Container`가 그 표식을 읽었던 것과 완전히 같은 메커니즘이다. NestJS는 그 위에 라우팅·DI·검증을 얹은 "제품화된 메타데이터 프레임워크"라고 생각하면 된다.

### 5. 오늘 그려야 할 흐름

Day 1 시점에서 요청이 흐르는 범위는 여기까지다.

```
GET /books
    │
    ▼
┌─────────────────────┐
│ BooksController     │  @Get() → findAll() 실행 → 반환값이 곧 응답 바디
└─────────────────────┘
```

내일부터 이 컨트롤러 아래로 Service → Repository 계층이 붙는다. 오늘은 **"URL → 컨트롤러 메서드"** 연결만 확실히 잡으면 된다.

### 6. 반환값이 곧 응답이 되는 규칙

Express에서는 `res.json(...)`처럼 응답 객체를 직접 만졌다. NestJS 컨트롤러 핸들러는 **그냥 값을 `return`하면 그게 응답 바디**가 된다. 프레임워크가 직렬화(JSON 변환)와 상태코드 부여를 대신한다.

```ts
@Get()
findAll(): string[] {
  return ['1984', 'Dune']; // → HTTP 200 + JSON 배열로 응답
}
```

- `@Get`은 기본 200, `@Post`는 기본 201로 상태코드가 정해진다(뒤 일차에서 `@HttpCode`로 조정하는 걸 본다).
- 객체·배열을 반환하면 자동으로 JSON 직렬화된다. `res`를 직접 다룰 일이 거의 없다.

이 "return 값 = 응답" 규칙 덕분에 컨트롤러가 얇아진다. HTTP의 세부(직렬화·헤더·상태코드)를 프레임워크에 맡기고, 우리는 **"무엇을 돌려줄지"**에만 집중한다.

---

## 실무·채용 연결

- 국내 Node.js 서버 공고의 기술스택이 그대로 **"Node.js, TypeScript, Nest.js, Jest"**인 경우가 많다. 오늘 배우는 `@Module`/`@Controller`는 그런 공고에서 요구하는 프레임워크의 가장 기본 골격이다.
- NestJS를 백엔드 표준으로 쓰는 조직이 많다. 실무 팀은 대부분 "모듈 단위로 기능을 쪼개는" 구조를 쓰기 때문에, `@Module`을 읽고 앱 구조를 파악하는 능력이 온보딩 첫날부터 필요하다.
- 면접에서 **"NestJS의 3요소가 뭐냐"**, **"컨트롤러는 왜 얇아야 하냐"**는 워밍업 질문으로 자주 나온다. 오늘 노트의 표 하나만 말할 수 있어도 절반은 답한 것이다.

---

## 흔한 실수와 함정

1. **컨트롤러를 모듈에 등록하지 않음** — `@Controller`만 붙이고 `@Module`의 `controllers` 배열에 넣지 않으면, 클래스는 존재하지만 **라우팅이 전혀 안 잡힌다**. 요청을 보내면 404가 온다. "핸들러는 분명 있는데 404"라면 십중팔구 모듈 등록 누락이다.

2. **경로에 슬래시를 중복으로 씀** — `@Controller('/books')`처럼 앞 슬래시를 넣거나 `@Get('/featured')`로 쓰면 대개는 동작하지만, 접두사와 세그먼트 규칙이 헷갈리기 시작한다. 관례는 **접두사·세그먼트 모두 슬래시 없이** (`'books'`, `'featured'`).

3. **컨트롤러에 로직을 다 넣어버림** — Day 1엔 서비스가 없으니 컨트롤러 안에서 다 하고 싶어진다. 하지만 이 습관이 들면 레이어드 아키텍처가 무너진다. 오늘은 "반환값만 돌려주는" 최소 형태로 유지하고, 로직은 내일 서비스로 내려보낼 자리를 비워둔다.

4. **`reflect-metadata` import 누락** — 데코레이터가 메타데이터를 남기려면 앱 진입점에서 `import 'reflect-metadata'`가 한 번은 실행돼야 한다. 없으면 부팅 시 메타데이터 관련 에러가 난다(스테이지 4에서도 같은 import를 맨 위에 뒀다).

---

## 오늘 실습과의 연결 (힌트만)

- 실습에서는 `TodosController`에 `@Controller('todos')`를 붙이고, 첫 라우팅부터 결선하게 된다. 오늘 배운 `@Get()` = 접두사 자체, `@Get(':id')` = 세그먼트 라우팅 구분을 떠올려라.
- `app.module.ts`의 `controllers` 배열에 컨트롤러를 **반드시 넣어야** 라우팅이 산다. 위 함정 1번을 실습에서 만나면 이 노트를 다시 보라.
- 스켈레톤의 `throw new Error('TODO: ...')`를 실제 반환문으로 바꾸는 것이 오늘의 최소 목표다. 서비스 호출은 내일 붙이므로, 오늘은 "라우팅이 살아있는지"까지만 확인하면 충분하다.

---

## 셀프 체크

1. `@Module` 데코레이터가 "선언적"이라는 말은 무슨 뜻인가? 우리가 `new Controller()`를 직접 부르지 않는 이유와 연결해 설명해보라.
2. `@Controller('books')` + `@Get('featured')` 조합은 어떤 URL에 매핑되는가?
3. 컨트롤러를 `@Module`의 `controllers` 배열에 등록하지 않으면 어떤 증상이 나타나는가?
4. NestJS의 데코레이터 기반 라우팅이 스테이지 4에서 만든 미니 DI의 메타데이터 방식과 어떤 점에서 같은 발상인가?
5. "컨트롤러는 얇아야 한다"는 원칙을 Day 1 수준에서 실천한다면 컨트롤러 메서드 안에 무엇을 넣고 무엇을 넣지 말아야 하는가?
