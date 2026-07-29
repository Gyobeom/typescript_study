# Day 3 — Repository와 DTO (인터페이스 추상화 · 커스텀 프로바이더 · 검증)

> 이 노트는 **실습 전 30분 이론용**이다. 실습(Todo API)의 답은 담지 않는다.
> 예시 코드는 실습과 다른 도메인(도서관 `books`)으로 설명한다.

---

## 오늘의 학습 목표

1. **Repository 계층**이 "데이터를 어디에/어떻게 저장하는가"를 캡슐화한다는 것을 이해한다.
2. 서비스가 **인터페이스에만 의존**하고 구현을 몰라야 하는 이유(교체 가능성)를 설명한다.
3. 인터페이스는 런타임에 사라지므로 **인젝션 토큰**이 필요하다는 것을 안다.
4. **커스텀 프로바이더** `{ provide: 토큰, useClass: 구현 }`의 문법과 의미를 손에 익힌다.
5. **DTO**의 역할과, 의존성 없는 **수동 검증**의 흐름을 이해한다.

---

## 개념 설명

### 1. Repository — 저장소를 계층으로 분리하기

Day 2까지 만든 서비스는 데이터를 어디서 가져올까? 배열을 직접 들고 있으면, 나중에 DB로 바꿀 때 서비스를 통째로 뜯어고쳐야 한다. 그래서 **데이터 접근을 별도 계층(Repository)**으로 뺀다.

```
Controller → Service → Repository → (인메모리 Map / DB / 외부 API ...)
              규칙        데이터 접근
```

Repository의 규칙은 하나다: **"저장/조회의 방법(how)"만 알고, "왜(비즈니스 규칙)"는 모른다.**

### 2. 인터페이스에 의존한다 — 교체 가능한 설계

서비스가 `InMemoryBookRepository`라는 **구체 클래스**에 직접 의존하면, 인메모리에 못 박힌다. 대신 **인터페이스**에 의존하게 하면 구현을 자유롭게 갈아끼울 수 있다.

```ts
// books.repository.ts (예시 도메인)

// (1) 계약 = 인터페이스
export interface BookRepository {
  findAll(): Book[];
  findById(id: number): Book | undefined;
  save(title: string): Book;
}

// (2) 인메모리 구현
export class InMemoryBookRepository implements BookRepository {
  private readonly store = new Map<number, Book>();
  private seq = 1;
  findAll() { return [...this.store.values()]; }
  findById(id: number) { return this.store.get(id); }
  save(title: string) {
    const book = { id: this.seq++, title };
    this.store.set(book.id, book);
    return book;
  }
}
```

이제 서비스는 `BookRepository`(인터페이스)만 알면 된다. 내일 DB 구현 `PostgresBookRepository`로 바꿔도 **서비스 코드는 한 줄도 안 바뀐다**. 이것이 레이어드 아키텍처가 주는 가장 큰 실무적 이득이다.

> **스테이지 2/3 연결**: "계약(인터페이스)에 의존하고 구현에 의존하지 말라"는
> 스테이지 2에서 배운 원칙 그대로다. Day 3은 그 원칙을 DI와 결합하는 자리다.

### 3. 인터페이스는 런타임에 없다 → 인젝션 토큰

여기서 문제가 하나 생긴다. Day 2의 DI는 **생성자 파라미터의 "타입"을 읽어서** 주입했다. 그런데 **인터페이스는 컴파일되면 사라진다**(TypeScript 인터페이스는 런타임 값이 아니다). 그래서 Nest가 `constructor(repo: BookRepository)`를 봐도 주입할 대상을 못 찾는다.

해결책: 인터페이스 대신 **문자열(또는 심볼) 토큰**을 만들어 그걸로 바인딩한다.

```ts
// 인젝션 토큰 — 런타임에 살아남는 "이름표"
export const BOOK_REPOSITORY = 'BOOK_REPOSITORY';
```

### 4. 커스텀 프로바이더 — `{ provide, useClass }`

토큰과 구현을 이어주는 것이 **커스텀 프로바이더**다. 모듈의 `providers` 배열에 객체 형태로 등록한다.

```ts
@Module({
  controllers: [BooksController],
  providers: [
    BooksService,
    // "BOOK_REPOSITORY 라는 토큰을 요청하면 InMemoryBookRepository 를 준다"
    { provide: BOOK_REPOSITORY, useClass: InMemoryBookRepository },
  ],
})
export class BooksModule {}
```

그리고 서비스는 `@Inject(토큰)`으로 명시적으로 받아온다.

```ts
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class BooksService {
  constructor(
    @Inject(BOOK_REPOSITORY) private readonly repo: BookRepository,
  ) {}
}
```

> **스테이지 4 연결 (핵심)**
> `{ provide: 토큰, useClass: 구현 }`은 스테이지 4에서 만든 컨테이너의
> **`register(토큰, 구현)` + `resolve(토큰)`**과 정확히 같은 "토큰 → 구현 바인딩"이다.
> 일반 클래스 프로바이더(`providers: [BooksService]`)는 "클래스 자신이 토큰"인 경우고,
> 커스텀 프로바이더는 "**토큰과 구현을 따로**" 지정하는 경우다. 인터페이스에 의존할 때
> 반드시 후자가 필요하다.

정리하면 세 조각이 한 세트로 움직인다.

| 조각 | 위치 | 역할 |
|------|------|------|
| `export const BOOK_REPOSITORY = '...'` | repository | 런타임에 살아남는 토큰 |
| `{ provide: BOOK_REPOSITORY, useClass: ... }` | module | 토큰 → 구현 바인딩 |
| `@Inject(BOOK_REPOSITORY) repo` | service | 토큰으로 구현 받기 |

### 5. DTO와 수동 검증

**DTO(Data Transfer Object)**는 계층 간에 오가는 데이터의 형태를 정의하는 객체다. 특히 **바깥에서 들어오는 요청 바디**의 모양을 규정한다.

```ts
// 생성 요청 바디 — 클라이언트는 title만 보낸다 (id는 서버가 정함)
export class CreateBookDto {
  title!: string;
}
```

바깥에서 온 데이터는 **믿을 수 없으므로** 반드시 검증한다. NestJS 실무에선 보통 `class-validator`를 쓰지만, 이 스테이지는 의존성을 줄이고 원리를 보이려고 **수동 검증 함수**를 쓴다.

```ts
export function validateCreateBookDto(body: unknown): { title: string } {
  const errors: string[] = [];
  const b = body as Record<string, unknown> | null;

  if (!b || typeof b !== 'object') throw ['body must be an object'];

  if (typeof b.title !== 'string') {
    errors.push('title must be a string');
  } else if (b.title.trim().length === 0) {
    errors.push('title must not be empty');
  }

  if (errors.length > 0) throw errors;      // 실패 → 메시지 배열을 던짐
  return { title: (b.title as string).trim() }; // 성공 → 정규화된 값
}
```

검증 함수가 던진 에러 배열은 **컨트롤러가 잡아서 `BadRequestException`(400)으로 변환**한다(그 흐름은 Day 4에서 자세히 다룬다).

---

## 실무·채용 연결

- **Repository 패턴**과 **인터페이스 기반 의존성 역전(DIP)**은 백엔드 면접에서 아키텍처 질문의 핵심이다. "DB를 나중에 바꿀 수 있게 설계하려면?"에 대한 표준 답이 오늘 내용이다.
- 국내 테크 기업/국내 테크 기업 같은 규모에서는 **저장소 구현이 자주 바뀐다**(캐시 추가, 샤딩, 외부 서비스 이전 등). 서비스가 인터페이스에만 의존하도록 짜여 있으면 그 변경이 국소화된다. 이 감각이 시니어와 주니어를 가른다.
- **DTO와 입력 검증**은 보안·안정성의 최전선이다. "들어오는 데이터를 믿지 않는다"는 원칙은 어느 백엔드 코드리뷰에서도 통용된다.

---

## 흔한 실수와 함정

1. **인터페이스를 그냥 타입으로 주입하려 함** — `constructor(private repo: BookRepository)`처럼 토큰 없이 인터페이스만 쓰면, 런타임에 타입이 사라져 Nest가 주입 대상을 못 찾는다. `Nest can't resolve dependencies` 에러가 뜬다. **반드시 토큰 + `@Inject`** 세트를 쓴다.

2. **토큰 문자열 오타 / 불일치** — `provide`에 쓴 토큰과 `@Inject`에 쓴 토큰의 철자가 다르면 조용히 매칭 실패한다. 그래서 토큰을 **`export const`로 한 곳에 정의**하고 양쪽에서 import 하는 것이 안전하다(매직 스트링을 직접 타이핑하지 말 것).

3. **커스텀 프로바이더를 배열에 안 넣음** — `{ provide, useClass }`를 만들어놓고 `providers` 배열에 등록하지 않으면 바인딩이 없는 것과 같다. Day 2의 "등록 누락" 함정의 변형이다.

4. **검증을 저장소나 서비스 깊숙이에서 함** — 입력 검증은 **경계(컨트롤러/DTO)에서** 하는 것이 정석이다. 안쪽 계층은 이미 검증된 데이터만 다룬다고 가정할 수 있어야 로직이 단순해진다.

---

## 오늘 실습과의 연결 (힌트만)

- 실습에서는 저장소 인터페이스와 인메모리 구현을 만들고, 모듈에서 **토큰 → 구현**을 바인딩하게 된다. 위 표의 "세 조각 한 세트"를 그대로 대응시켜보라: 토큰 정의 / `useClass` 바인딩 / `@Inject` 주입.
- DTO 검증 함수는 **성공 시 정규화된 값을 반환**하고 **실패 시 메시지 배열을 던지는** 계약이다. `title`이 문자열인지, 빈 문자열은 아닌지 정도를 점검하는 흐름을 떠올려라(구체 구현은 직접).
- 저장소를 `Map`으로 관리한다면, id 채번(다음 id)과 조회/삭제 시 "없는 경우"를 어떻게 표현할지 미리 생각해두면 Day 4가 수월하다.

---

## 셀프 체크

1. 서비스가 구체 저장소 클래스가 아니라 인터페이스에 의존해야 하는 이유를 한 문장으로.
2. 인터페이스에 의존하려는데 왜 별도의 "인젝션 토큰"이 필요한가?
3. `{ provide: BOOK_REPOSITORY, useClass: InMemoryBookRepository }`를 스테이지 4의 컨테이너 개념으로 번역하면?
4. 토큰을 매직 스트링으로 직접 타이핑하지 않고 `export const`로 정의해 공유하는 이유는?
5. 입력 검증을 안쪽 계층이 아니라 경계(컨트롤러/DTO)에서 하는 것이 왜 더 나은가?
