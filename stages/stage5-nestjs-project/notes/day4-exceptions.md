# Day 4 — 예외 처리 (HttpException 체계 · 404/400 변환 흐름)

> 이 노트는 **실습 전 30분 이론용**이다. 실습(Todo API)의 답은 담지 않는다.
> 예시 코드는 실습과 다른 도메인(도서관 `books`)으로 설명한다.

---

## 오늘의 학습 목표

1. NestJS의 **HttpException 체계**가 예외를 HTTP 응답으로 자동 변환한다는 것을 이해한다.
2. `NotFoundException`(404), `BadRequestException`(400) 등 내장 예외의 계보를 안다.
3. 서비스에서 `throw NotFoundException` → 클라이언트가 **404 응답**을 받기까지의 흐름을 그린다.
4. 예외를 **어느 계층에서** 던지고 잡아야 하는지(관심사 분리)를 판단한다.
5. `try/catch`로 잡은 검증 에러를 `BadRequestException`으로 변환하는 패턴을 익힌다.

---

## 개념 설명

### 1. NestJS는 예외를 응답으로 "자동 변환"한다

전통적 방식이라면, "없는 리소스"를 만났을 때 직접 `res.status(404).json(...)`를 써야 한다. NestJS는 이걸 뒤집었다. **그냥 예외를 던지면(throw), 프레임워크가 알아서 HTTP 응답으로 바꿔준다.**

```ts
// 서비스 어딘가에서
throw new NotFoundException('Book not found');
```

이 한 줄이 클라이언트에게는 이렇게 도착한다.

```json
// HTTP 404 Not Found
{ "statusCode": 404, "message": "Book not found", "error": "Not Found" }
```

이 변환을 담당하는 것이 Nest 내부의 **전역 예외 필터(Exception Filter)**다. 우리가 아무것도 안 걸어도 기본 필터가 항상 켜져 있어서, `HttpException` 계열을 잡아 알맞은 상태코드·JSON으로 만들어준다.

### 2. HttpException 계보

모든 HTTP 예외의 뿌리는 `HttpException`이다. 자주 쓰는 것들은 그 자식으로, **상태코드가 이름에 못 박혀 있다**.

| 예외 클래스 | 상태코드 | 언제 던지나 |
|-------------|---------|------------|
| `BadRequestException` | 400 | 입력이 잘못됨 (검증 실패) |
| `NotFoundException` | 404 | 리소스를 못 찾음 |
| `UnauthorizedException` | 401 | 인증 안 됨 |
| `ForbiddenException` | 403 | 권한 없음 |
| `ConflictException` | 409 | 상태 충돌 (중복 등) |
| `HttpException` (직접) | 임의 | 커스텀 상태코드 필요 시 |

```
HttpException (뿌리)
├── BadRequestException      (400)
├── NotFoundException        (404)
├── UnauthorizedException    (401)
└── ...
```

이름만 골라 던지면 상태코드가 정해진다는 게 핵심이다. 숫자를 직접 외울 필요가 없다.

### 3. 404 변환 흐름 — 없는 리소스를 조회할 때

가장 흔한 시나리오다. 서비스가 저장소에서 조회했는데 없으면 `NotFoundException`을 던진다.

```ts
// books.service.ts (예시 도메인)
@Injectable()
export class BooksService {
  constructor(@Inject(BOOK_REPOSITORY) private readonly repo: BookRepository) {}

  findOne(id: number): Book {
    const book = this.repo.findById(id);
    if (!book) {
      throw new NotFoundException(`Book #${id} not found`); // 여기서 던짐
    }
    return book;
  }
}
```

흐름을 그림으로:

```
GET /books/9999
    │
    ▼
BooksController.findOne(9999)   ← 그냥 서비스를 호출만 함
    │
    ▼
BooksService.findOne(9999)
    │  repo.findById(9999) → undefined
    │  throw new NotFoundException(...)
    │
    ▼ (예외가 컨트롤러를 관통해 위로 전파)
Nest 기본 예외 필터
    │  NotFoundException → HTTP 404 + JSON 바디로 변환
    ▼
클라이언트: 404 Not Found
```

주목할 점: **컨트롤러는 예외를 잡지 않는다.** 서비스가 던진 예외가 컨트롤러를 그냥 통과해 프레임워크까지 올라가고, 거기서 응답으로 바뀐다. 그래서 컨트롤러가 여전히 얇게 유지된다.

### 4. 400 변환 흐름 — 잘못된 입력

검증(Day 3)에서 실패하면 400을 돌려줘야 한다. 이때는 컨트롤러에서 **검증 에러를 잡아 `BadRequestException`으로 감싼다**.

```ts
// books.controller.ts (예시 도메인)
@Post()
create(@Body() body: CreateBookDto): Book {
  let validated: { title: string };
  try {
    validated = validateCreateBookDto(body); // 실패 시 메시지 배열을 throw
  } catch (errors) {
    throw new BadRequestException(errors as string[]); // 400으로 변환
  }
  return this.booksService.create(validated.title);
}
```

- 검증 함수는 "메시지 배열"이라는 **도메인 중립적** 실패 신호를 던진다.
- 컨트롤러가 그걸 잡아 **HTTP 관심사(400)**로 번역한다.
- 즉 "검증 로직"과 "HTTP 상태코드 결정"의 관심사가 깔끔히 나뉜다.

### 5. 예외를 어느 계층에서 다루나

관심사 분리의 관점에서 정리하면:

| 상황 | 던지는 곳 | 이유 |
|------|-----------|------|
| 리소스 없음(404) | **Service** | "없음"은 비즈니스 규칙 판단 |
| 입력 검증 실패(400) | **Controller** (검증 함수 → catch) | 입력 검증은 경계의 책임 |
| 응답 변환 | **Nest 기본 필터** | 우리가 손대지 않음 |

`ParseIntPipe` 같은 파이프는 `GET /books/abc`(숫자 아님)를 자동으로 400으로 막아준다 — 이것도 "경계에서의 검증"의 한 형태다.

---

## 실무·채용 연결

- **"에러를 어떻게 처리하냐"**는 백엔드 설계 면접의 핵심이다. NestJS의 "예외를 던지면 필터가 응답으로 변환"하는 모델은, 에러 처리를 한 곳으로 모아 일관성을 주는 대표 사례로 설명하기 좋다.
- 실무 API는 **상태코드 규약**(404/400/409 등)을 정확히 지켜야 클라이언트·모니터링·알림이 제대로 동작한다. 아무 에러나 500으로 뭉개면 장애 대응이 어려워진다. 오늘 배우는 "의미에 맞는 예외 클래스 선택"이 그 출발점이다.
- 규모 있는 서비스에서는 **전역 예외 필터를 커스터마이즈**해 로깅·에러 포맷을 통일한다. 오늘 배우는 기본 필터의 동작을 알아야 그 커스터마이징을 이해할 수 있다.

---

## 흔한 실수와 함정

1. **`undefined`를 그냥 반환** — 없는 리소스를 조회했을 때 예외를 안 던지고 `undefined`나 `null`을 반환하면, 클라이언트는 **200 OK + 빈 바디**를 받는다. "없음"과 "빈 성공"이 구별되지 않아 버그의 온상이 된다. **반드시 `NotFoundException`을 던져** 404로 만든다.

2. **일반 `Error`를 던짐** — `throw new Error('not found')`는 `HttpException`이 아니므로 기본 필터가 **500 Internal Server Error**로 처리한다. 의도한 404가 아니라 서버 에러로 나간다. 반드시 **Nest 내장 예외 클래스**를 쓴다.

3. **컨트롤러에서 서비스 예외를 굳이 try/catch로 잡음** — 404 같은 건 서비스가 던지고 그대로 통과시키면 된다. 컨트롤러에서 잡아 다시 던지는 건 불필요한 중복이고 컨트롤러를 두껍게 만든다. (검증 에러처럼 **변환이 필요한 경우에만** 잡는다.)

4. **검증 실패를 500으로 흘림** — 검증 함수가 던진 에러 배열을 `BadRequestException`으로 감싸지 않고 방치하면 500이 된다. Day 3의 검증과 Day 4의 변환은 **한 세트**로 붙어 있어야 400이 나온다.

---

## 오늘 실습과의 연결 (힌트만)

- 실습 서비스의 조회/수정/삭제에서 "없는 id"를 만나면 어떻게 반응해야 할지 생각하라. 위 404 흐름의 `findOne`을 떠올리면 된다 — 저장소가 `undefined`/`false`를 주면 그걸 **예외로 승격**한다.
- 생성(create) 경로에서는 Day 3의 검증 함수 결과를 컨트롤러에서 어떻게 다뤄야 400이 나오는지 위 400 흐름을 참고하라.
- e2e 테스트(내일)는 `.status`가 정확히 404/400/201/204인지 확인한다. 오늘 예외를 **의미에 맞게** 던져두면 내일 테스트가 초록으로 바뀐다.

---

## 셀프 체크

1. 서비스에서 `throw new NotFoundException(...)`을 하면 클라이언트가 최종적으로 받는 상태코드와, 그 변환을 담당하는 주체는?
2. `throw new Error('nope')`와 `throw new NotFoundException('nope')`는 클라이언트 응답이 어떻게 다른가?
3. 404는 서비스에서, 400(검증 실패)은 컨트롤러에서 다루는 것이 자연스러운 이유는?
4. 없는 리소스 조회 시 예외 대신 `undefined`를 반환하면 어떤 문제가 생기는가?
5. 검증 함수가 던진 메시지 배열을 컨트롤러에서 `BadRequestException`으로 감싸지 않으면 응답 코드는 몇이 되는가?
