# TypeScript 클래스 → NestJS 5주 커리큘럼

> **대상**: TS 기초 문법(타입, 인터페이스)은 알지만 클래스 설계·활용 경험이 부족한 학습자
> **목표**: 국내 테크 기업·국내 테크 기업급 Node.js/TypeScript 서버 채용의 실질 요구 — "TypeScript 기반 서버 개발 경험 + OOP/TDD 소양 + NestJS" — 에 도달하는 것
> **페이스**: 하루 1~2시간 (이론 30분 + 실습 60~90분) × 주 5일 × 5주
> **방식**: TDD — 각 문제마다 Jest 테스트가 먼저 주어지고, 여러분이 클래스를 구현해 테스트를 통과시킵니다.

## 학습 루틴 (매일 동일)

1. **이론 (30분)**: 해당 스테이지 `notes/` 폴더의 **오늘 일차 학습 노트**를 읽는다 (예: `notes/day1-*.md`). README는 주차 전체 개요·진행법 안내다.
2. **실습 (60~90분)**: `exercises/`의 오늘 문제 파일을 연다 → `npm run check:stageN`으로 실패하는 테스트를 확인한다 → `// TODO`를 구현한다 → 테스트가 초록이 될 때까지 반복한다.
3. **막혔을 때**: 20분 이상 막히면 `solutions/`의 같은 파일명을 열어 **비교하며** 이해하고, 답안을 덮고 다시 스스로 작성한다.
4. **마무리 (5분)**: `npm run journal -- stageN dayM 문제명`으로 오늘 일지를 생성해 작성하고, `PROGRESS.md` 대시보드에 체크한다.

## Git 워크플로 (브랜치 전략)

| 브랜치 | 용도 | 규칙 |
|---|---|---|
| `main` | **문제·학습 자료 원본** (스켈레톤·테스트·노트·답안) | 직접 수정하지 않는다. 자료 갱신·새 문제 추가만 이 브랜치에서 |
| `study` | **내 풀이 작업 브랜치** | 매일 여기서 exercises를 풀고 커밋한다 |

```bash
git switch study                          # 학습은 항상 study 브랜치에서
# ... exercises 풀기 ...
git add stages/stage1-class-basics/exercises journal PROGRESS.md
git commit -m "stage1 day1: Point 클래스 풀이"
git push                                  # 풀이를 원격 study 브랜치에 백업
```

- 커밋 단위는 **하루 1커밋** 권장 (메시지: `stageN dayM: <문제명> 풀이`).
- main에 자료가 갱신되면 `git switch study && git merge main`으로 가져온다.
- main은 항상 "풀리지 않은 원본" 상태이므로, 처음부터 다시 풀고 싶으면 main의 exercises를 체크아웃하면 된다: `git checkout main -- stages/stageN-*/exercises`

## 검증 명령

| 명령 | 용도 |
|---|---|
| `npm run check:stageN` | 스테이지 N을 **내 구현(exercises)** 대상으로 채점 |
| `npm run check:stageN:answer` | 모범 답안 대상으로 실행 (테스트 자체 확인용) |
| `npm run typecheck` | 저장소 전체 타입 체크 (strict) |
| `npm run check:all` | 전 스테이지 채점 |

---

## 스테이지 1 (1주차) — 클래스 기초 `stages/stage1-class-basics`

**학습 목표**: 클래스를 "타입이 있는 객체 공장"으로 자유롭게 만들 수 있다. NestJS 코드에서 가장 많이 보게 될 `constructor(private readonly ...)` 축약을 손에 익힌다.

| 일차 | 이론 | 실습 |
|---|---|---|
| 1 | 클래스 선언, 생성자, 프로퍼티, 메서드 | 첫 클래스 구현 문제 |
| 2 | 접근제어자 public / private / protected / readonly | 캡슐화 문제 |
| 3 | 파라미터 프로퍼티 축약, getter/setter | 축약 문법 문제 |
| 4 | static 멤버, 인스턴스 vs 클래스 레벨 | static 활용 문제 |
| 5 | 종합 — 작은 도메인 클래스 설계 | 주간 종합 문제 |

**완료 기준**: `npm run check:stage1` 전체 통과 + PROGRESS.md 체크

## 스테이지 2 (2주차) — 계약 설계 `stages/stage2-contracts`

**학습 목표**: interface `implements`와 추상 클래스로 "구현이 아니라 계약에 의존하는" 코드를 쓴다. 상속보다 조합을 판단 기준으로 삼는다. SOLID를 코드로 체감한다.

| 일차 | 이론 | 실습 |
|---|---|---|
| 1 | interface와 implements — 계약으로서의 인터페이스 | 인터페이스 구현 문제 |
| 2 | 추상 클래스 = 계약 + 부분 구현, 언제 쓰나 | 추상 클래스 문제 |
| 3 | 상속 vs 조합 — 왜 실무는 조합을 선호하나 | 조합 리팩터링 문제 |
| 4 | SOLID 입문 (SRP / OCP / DIP 중심) | 원칙 위반 코드 고치기 |
| 5 | 종합 — 계약 기반 설계 | 주간 종합 문제 |

**완료 기준**: `npm run check:stage2` 전체 통과

## 스테이지 3 (3주차) — 제네릭 클래스 `stages/stage3-generics`

**학습 목표**: 제네릭 클래스와 제약(`extends`)으로 재사용 가능한 컴포넌트를 만든다. 실무 표준 패턴인 `Repository<T>`를 직접 구현한다.

| 일차 | 이론 | 실습 |
|---|---|---|
| 1 | 제네릭 클래스 기초 | 제네릭 컨테이너 문제 |
| 2 | 제네릭 제약 (`T extends ...`), keyof | 제약 활용 문제 |
| 3 | 제네릭 + 인터페이스 결합 | 계약 있는 제네릭 문제 |
| 4 | Repository&lt;T&gt; 패턴 | 인메모리 리포지토리 구현 |
| 5 | 종합 — 유틸리티 타입과 클래스 | 주간 종합 문제 |

**완료 기준**: `npm run check:stage3` 전체 통과

## 스테이지 4 (4주차) — 데코레이터와 DI `stages/stage4-decorators-di`

**학습 목표**: NestJS의 마법처럼 보이는 `@Injectable()`·`@Get()`이 실제로 어떻게 동작하는지 원리를 안다. reflect-metadata로 **미니 DI 컨테이너를 직접 구현**한다. (실무 기술블로그가 다루는 Custom Decorator·IoC 수준의 기초)

| 일차 | 이론 | 실습 |
|---|---|---|
| 1 | 데코레이터란 — 클래스 데코레이터 | 클래스 데코레이터 문제 |
| 2 | 메서드·프로퍼티 데코레이터 | 메서드 데코레이터 문제 |
| 3 | reflect-metadata와 메타데이터 프로그래밍 | 메타데이터 문제 |
| 4~5 | DI 원리 — 생성자 주입, IoC 컨테이너 | **미니 DI 컨테이너 구현** (2일) |

**완료 기준**: `npm run check:stage4` 전체 통과 (직접 만든 DI 컨테이너가 테스트 통과)

## 스테이지 5 (5주차) — NestJS 미니 프로젝트 `stages/stage5-nestjs-project`

**학습 목표**: Controller → Service → Repository 레이어드 구조의 NestJS 서버를 만들고 Jest/e2e 테스트까지 작성한다. 4주차에 직접 만든 DI가 NestJS 안에서 어떻게 쓰이는지 연결한다. **이 스테이지 완주가 곧 채용공고의 "TypeScript 기반 서버 개발 경험"의 시작점이다.**

| 일차 | 이론 | 실습 |
|---|---|---|
| 1 | NestJS 구조 — Module / Controller / Provider | 모듈·컨트롤러 문제 |
| 2 | Service와 DI — 4주차 원리와 연결 | 서비스 계층 문제 |
| 3 | Repository 계층, DTO와 유효성 | 리포지토리·DTO 문제 |
| 4 | 예외 처리, 레이어드 아키텍처 정리 | 예외 처리 문제 |
| 5 | e2e 테스트, 전체 조립 | e2e 통과 + `npm run start:stage5` 부팅 |

**완료 기준**: `npm run check:stage5` 전체 통과 + 서버 실제 부팅 확인

---

## 5주 이후 로드맵 (참고)

- TypeORM/Prisma로 실제 DB 연결 → 토이 프로젝트를 배포까지 (국내 테크 기업 공고의 "운영 경험" 대비)
- 실무 기술블로그 "NestJS 환경에 맞는 Custom Decorator 만들기" 읽기 — 4주차 지식으로 읽힌다
- Jest 테스트를 먼저 쓰는 TDD 사이클로 토이 프로젝트 기능 추가 (국내 테크 기업 우대사항 TDD)
