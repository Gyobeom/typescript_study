// 복습(인출 연습) — 스테이지 5 종합 (NestJS 레이어드)
//
// 이 문제에는 구현 힌트가 없다. 아래 "요구사항 명세"만 읽고,
// 스테이지 5에서 배운 NestJS 레이어드 구조(Module / Controller / Service /
// Repository / DTO / 예외)를 스스로 꺼내 써서 재고 관리 API를 완성하라.
//
// 본 문제(Todo API)는 파일을 계층별로 쪼갰지만, 이 복습은 한 파일에 전부 담는다.
// 아래 export 시그니처(클래스명/함수명/토큰)는 solutions 와 test 가 그대로 쓰므로
// 이름을 바꾸지 말고, TODO 로 표시된 본문만 채워라.
//
// ─────────────────────────────────────────────────────────────────────────
// 도메인: 창고 재고 품목(InventoryItem).
//   품목은 이름(name)과 수량(quantity)을 가진다. 입고/출고로 수량이 변한다.
//
// 엔드포인트 명세 (@Controller('items')):
//
//   GET    /items          → 200, 전체 품목 배열
//   GET    /items/:id      → 200, 단건. 없으면 404
//   POST   /items          → 201, 생성된 품목
//                            body: { name: string, quantity?: number }
//                            검증 실패 시 400 (아래 검증 규칙)
//   PATCH  /items/:id/restock → 200, 수량 증가 후 품목. 없으면 404
//                            body: { amount: number }, amount 검증 실패 시 400
//   PATCH  /items/:id/ship  → 200, 수량 감소 후 품목. 없으면 404
//                            body: { amount: number }, amount 검증 실패 시 400,
//                            재고보다 많이 출고하면 400
//   DELETE /items/:id      → 204. 없으면 404
//
// 검증 규칙 (수동 검증 — class-validator 안 씀):
//   CreateItemDto:
//     - body 가 객체가 아니면          → ['body must be an object']
//     - name 이 string 이 아니면        → 'name must be a string'
//     - name 이 trim 후 빈 문자열이면    → 'name must not be empty'
//     - quantity 가 있는데 정수가 아니거나 음수면 → 'quantity must be a non-negative integer'
//     - quantity 생략 시 기본값 0
//     - 하나라도 위반이면 메시지 배열을 throw, 통과 시 { name, quantity } 반환
//   amount(입고/출고 공통):
//     - 정수가 아니거나 1 미만이면 → 'amount must be a positive integer' throw
//
// 계층 규칙:
//   - Controller 는 얇게: 검증/위임만. 로직은 Service.
//   - Service 는 저장소 인터페이스(InventoryRepository)에만 의존한다.
//   - Repository 는 인젝션 토큰(INVENTORY_REPOSITORY) + useClass 커스텀 프로바이더로 결선.
//   - 조회 실패는 Service 에서 NotFoundException(`Item #${id} not found`).
//   - 재고 부족 출고는 Service 에서 BadRequestException.
// ─────────────────────────────────────────────────────────────────────────

import {
  Module,
  Controller,
  Injectable,
  Inject,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

// ── 도메인 엔티티 ────────────────────────────────────────────────────────
export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
}

// ── DTO ──────────────────────────────────────────────────────────────────
export class CreateItemDto {
  name!: string;
  quantity?: number;
}

export class AmountDto {
  amount!: number;
}

// 생성 바디 수동 검증. 통과 시 정규화된 값, 실패 시 문자열 배열 throw.
export function validateCreateItemDto(body: unknown): {
  name: string;
  quantity: number;
} {
  throw new Error('TODO: CreateItemDto 수동 검증을 구현하라');
}

// 입고/출고 수량 검증. 통과 시 정수 amount 반환, 실패 시 문자열 throw.
export function validateAmount(body: unknown): number {
  throw new Error('TODO: amount 수동 검증을 구현하라');
}

// ── Repository ─────────────────────────────────────────────────────────────
export interface InventoryRepository {
  findAll(): InventoryItem[];
  findById(id: number): InventoryItem | undefined;
  create(name: string, quantity: number): InventoryItem;
  update(id: number, patch: { quantity: number }): InventoryItem | undefined;
  remove(id: number): boolean;
}

// 인터페이스는 런타임에 사라지므로 DI 컨테이너가 잡을 인젝션 토큰을 따로 둔다.
export const INVENTORY_REPOSITORY = 'INVENTORY_REPOSITORY';

export class InMemoryInventoryRepository implements InventoryRepository {
  private readonly store = new Map<number, InventoryItem>();
  private nextId = 1;

  findAll(): InventoryItem[] {
    throw new Error('TODO: 모든 품목을 반환하라');
  }

  findById(id: number): InventoryItem | undefined {
    throw new Error('TODO: id로 품목을 조회하라');
  }

  create(name: string, quantity: number): InventoryItem {
    throw new Error('TODO: 품목을 생성해 저장하라');
  }

  update(id: number, patch: { quantity: number }): InventoryItem | undefined {
    throw new Error('TODO: 품목 수량을 갱신하라 (없으면 undefined)');
  }

  remove(id: number): boolean {
    throw new Error('TODO: 품목을 삭제하라 (존재 여부 boolean 반환)');
  }
}

// ── Service ────────────────────────────────────────────────────────────────
@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY) private readonly repo: InventoryRepository,
  ) {}

  findAll(): InventoryItem[] {
    throw new Error('TODO: 모든 품목을 반환하라');
  }

  findOne(id: number): InventoryItem {
    throw new Error('TODO: id로 조회, 없으면 NotFoundException');
  }

  create(name: string, quantity: number): InventoryItem {
    throw new Error('TODO: 품목을 생성하라');
  }

  restock(id: number, amount: number): InventoryItem {
    throw new Error('TODO: 수량을 amount 만큼 늘려라. 없으면 NotFoundException');
  }

  ship(id: number, amount: number): InventoryItem {
    throw new Error(
      'TODO: 수량을 amount 만큼 줄여라. 없으면 NotFoundException, 재고 부족이면 BadRequestException',
    );
  }

  remove(id: number): void {
    throw new Error('TODO: 삭제하라. 없으면 NotFoundException');
  }
}

// ── Controller ───────────────────────────────────────────────────────────
@Controller('items')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  findAll(): InventoryItem[] {
    throw new Error('TODO: 전체 목록을 반환하라');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): InventoryItem {
    throw new Error('TODO: 단건 조회를 구현하라');
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateItemDto): InventoryItem {
    throw new Error('TODO: 검증 후 생성을 구현하라');
  }

  @Patch(':id/restock')
  restock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AmountDto,
  ): InventoryItem {
    throw new Error('TODO: 검증 후 입고를 구현하라');
  }

  @Patch(':id/ship')
  ship(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AmountDto,
  ): InventoryItem {
    throw new Error('TODO: 검증 후 출고를 구현하라');
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): void {
    throw new Error('TODO: 삭제를 구현하라');
  }
}

// ── Module ─────────────────────────────────────────────────────────────────
// TODO: controllers / providers 를 채워 모듈을 결선하라.
//   - providers 에 인젝션 토큰 커스텀 프로바이더( { provide, useClass } )가 포함돼야 한다.
// (지금은 빈 배열이라 주입이 실패한다. 클래스 로드 자체는 성공하므로 테스트는 개별 실패로 나온다.)
@Module({
  controllers: [],
  providers: [],
})
export class InventoryModule {}
