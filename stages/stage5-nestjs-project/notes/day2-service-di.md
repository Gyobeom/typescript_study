# Day 2 — Service와 의존성 주입 (DI)

> 이 노트는 **실습 전 30분 이론용**이다. 실습(Todo API)의 답은 담지 않는다.
> 예시 코드는 실습과 다른 도메인(도서관 `books`)으로 설명한다.

---

## 오늘의 학습 목표

1. **Service 계층**이 왜 필요한지 — 컨트롤러에서 비즈니스 로직을 분리하는 이유를 설명한다.
2. `@Injectable()`이 클래스를 "주입 가능한 프로바이더"로 표시한다는 것을 이해한다.
3. **생성자 주입(constructor injection)**의 문법과 동작을 손에 익힌다.
4. NestJS의 DI가 **스테이지 4에서 직접 만든 미니 DI 컨테이너와 같은 원리**임을 코드로 대조한다.
5. `@Module`의 `providers` 배열이 DI 등록 목록이라는 것을 안다.

---

## 개념 설명

### 1. 왜 Service를 따로 두는가

Day 1의 컨트롤러는 "얇게" 유지하라고 했다. 그럼 실제 로직은 어디로 가는가? → **Service**다.

```
Controller  = 요청을 받고 응답을 돌려주는 "창구" (HTTP 관심사)
Service     = 규칙을 적용하는 "일꾼"          (비즈니스 관심사)
```

관심사를 나누면 두 가지가 좋아진다.

- **테스트 용이성**: 서비스는 HTTP를 모르므로, 그냥 클래스 메서드처럼 단위 테스트할 수 있다.
- **재사용성**: 같은 로직을 여러 컨트롤러/스케줄러에서 호출할 수 있다.

### 2. `@Injectable()` — 프로바이더 표식

서비스 클래스에는 `@Injectable()`을 붙인다.

```ts
// books.service.ts (예시 도메인)
import { Injectable } from '@nestjs/common';

@Injectable()
export class BooksService {
  private readonly titles = ['1984', 'Dune'];

  findAll(): string[] {
    return [...this.titles];
  }
}
```

`@Injectable()`은 이 클래스를 **"DI 컨테이너가 관리해도 되는 부품"**으로 표시한다. 여기서 스테이지 4가 정확히 소환된다.

> **스테이지 4 연결 (핵심)**
> 스테이지 4에서 네가 직접 만든 것:
> ```ts
> export function Injectable(): ClassDecorator {
>   return (target) => { Reflect.defineMetadata(INJECTABLE_KEY, true, target); };
> }
> ```
> `@Injectable()`은 클래스에 `reflect-metadata`로 **"나는 주입 가능하다"는 표식**을 남긴다.
> NestJS의 `@Injectable()`도 **정확히 같은 일**을 한다. 이름도, 하는 일도 동일하다.
> 다른 점은, NestJS가 그 위에 스코프·라이프사이클 같은 실무 기능을 더 얹었을 뿐이다.

### 3. 생성자 주입 — 컨트롤러가 서비스를 "받는" 법

컨트롤러는 서비스를 **직접 만들지 않는다**. 생성자 파라미터로 **선언만** 하면 Nest가 채워준다.

```ts
// books.controller.ts (예시 도메인)
import { Controller, Get } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  // "나는 BooksService가 필요하다"고 선언만 한다.
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(): string[] {
    return this.booksService.findAll(); // 로직은 서비스에 위임
  }
}
```

`private readonly booksService: BooksService` 한 줄이 세 가지를 동시에 한다.

1. 생성자 파라미터로 의존성을 **선언**하고,
2. `private readonly` 접근제어자 덕에 TypeScript가 **자동으로 필드**를 만들어 대입하며,
3. Nest가 부팅 시 **타입(`BooksService`)을 읽어** 인스턴스를 찾아 넣어준다.

### 4. NestJS DI = 스테이지 4 미니 DI의 제품판

스테이지 4의 `Container.resolve`가 어떻게 동작했는지 떠올려보자.

```ts
// 스테이지 4에서 네가 만든 resolve의 뼈대
const paramTypes = Reflect.getMetadata('design:paramtypes', target) ?? [];
const deps = paramTypes.map((dep) => this.resolve(dep)); // 재귀 주입
const instance = new target(...deps);                    // 의존성 채워 생성
```

NestJS의 DI도 **똑같은 3단계**를 밟는다.

| 단계 | 스테이지 4 (직접 구현) | NestJS (제품) |
|------|----------------------|---------------|
| 표식 | `@Injectable()` → 메타데이터 | `@Injectable()` → 메타데이터 |
| 타입 읽기 | `Reflect.getMetadata('design:paramtypes')` | 내부적으로 동일 |
| 재귀 조립 | `resolve(dep)`로 파라미터마다 재귀 | 의존성 그래프를 순회 조립 |
| 캐싱 | `singletons` Map | 기본 스코프가 싱글턴 |

즉 **NestJS를 처음 배워도 낯설지 않은 이유**가 바로 이것이다. 너는 이미 이 엔진을 손으로 만들어봤다. Nest는 그 엔진에 대량 생산 마감을 입힌 것이다.

### 5. `providers`에 등록해야 주입된다

서비스에 `@Injectable()`을 붙이는 것만으로는 부족하다. **모듈의 `providers` 배열에 등록**해야 컨테이너가 안다.

```ts
@Module({
  controllers: [BooksController],
  providers: [BooksService], // ← 이 등록이 없으면 주입 실패
})
export class BooksModule {}
```

스테이지 4로 치면, `@Injectable`만 붙이고 컨테이너에 등록/resolve 대상이 되게 하지 않은 것과 같다.

---

## 실무·채용 연결

- 서버 개발 공고의 **"Nest.js"** 요구는 사실상 "DI 기반 레이어드 아키텍처를 다룰 수 있는가"를 묻는 것이다. 오늘 배우는 생성자 주입은 그 핵심 기술이다.
- **"의존성 주입이 왜 좋은가?"**는 백엔드 면접 단골 질문이다. 정답의 뼈대: ① 결합도를 낮춰 **테스트 시 가짜(mock) 구현으로 교체**할 수 있고, ② 객체 생성 책임을 프레임워크로 넘겨 **비즈니스 코드가 조립 로직에서 자유로워진다**.
- 실무에서 서비스 계층은 여러 팀이 공유하는 로직의 집합소다. "컨트롤러/서비스 분리"를 자연스럽게 하는지가 코드리뷰에서 바로 드러난다.

---

## 흔한 실수와 함정

1. **`providers`에 등록 안 함 → `Nest can't resolve dependencies`** — 가장 자주 만나는 에러다. 메시지를 읽는 법:
   ```
   Nest can't resolve dependencies of the BooksController (?).
   Please make sure that the argument BooksService at index [0]
   is available in the BooksModule context.
   ```
   해석: **"BooksController의 0번 인자(BooksService)를 찾을 수 없다"**. `(?)`가 못 찾은 자리다. 십중팔구 `providers: [BooksService]` 등록을 빠뜨린 것이다. 에러의 **클래스 이름·index 번호**를 보면 어느 의존성이 비었는지 정확히 짚을 수 있다.

2. **`@Injectable()` 데코레이터 누락** — 서비스에 데코레이터를 안 붙이면 메타데이터 표식이 없어 컨테이너가 관리 대상으로 인식하지 못한다. 스테이지 4에서 `isInjectable`가 `false`를 뱉던 상황과 같다.

3. **서비스를 `new`로 직접 생성** — `new BooksService()`를 컨트롤러 안에서 호출하면 DI의 이점이 전부 사라진다(테스트 교체 불가, 싱글턴 공유 깨짐). 항상 **생성자 파라미터로 받는다**.

4. **순환 의존성** — A 서비스가 B를, B가 다시 A를 주입받으면 Nest가 그래프를 조립하다 막힌다. 설계 신호로 받아들이고 로직을 한쪽으로 모으는 것이 정석이다(오늘 실습에선 만날 일이 거의 없다).

---

## 오늘 실습과의 연결 (힌트만)

- 실습에서 `TodosService`에 `@Injectable()`을 붙이고, 컨트롤러가 생성자로 그 서비스를 받게 된다. 위 예시의 `booksService` 자리를 떠올려라.
- 컨트롤러의 각 라우팅 핸들러는 이제 "직접 일하지 말고 **서비스 메서드를 호출해 그 반환값을 돌려주는**" 형태가 된다. Day 1에서 비워둔 자리에 서비스 호출이 들어간다.
- 주입이 안 될 때는 반드시 위 함정 1번의 에러 메시지를 **끝까지 읽어라**. 어느 클래스의 몇 번째 인자가 비었는지 메시지가 정확히 알려준다.

---

## 셀프 체크

1. 컨트롤러에서 비즈니스 로직을 서비스로 분리하면 얻는 이점 두 가지는?
2. `@Injectable()`이 실제로 클래스에 하는 일은 무엇인가? 스테이지 4의 구현과 대조해 설명해보라.
3. `private readonly svc: BooksService` 한 줄이 동시에 수행하는 세 가지 일은?
4. `Nest can't resolve dependencies of the X (?)` 에러를 만났다. 어디부터 확인해야 하는가?
5. NestJS DI와 스테이지 4 미니 DI가 공유하는 핵심 3단계(표식 → 타입 읽기 → 재귀 조립)를 각각 한 줄로 설명해보라.
