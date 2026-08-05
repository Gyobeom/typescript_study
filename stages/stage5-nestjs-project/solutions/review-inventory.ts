// 복습(인출 연습) 정답 — 스테이지 5 종합 (NestJS 레이어드)
//
// 도메인: 창고 재고 품목(InventoryItem). 명세는 exercises/review-inventory.ts 참고.
// 한 파일에 Module / Controller / Service / Repository / DTO / 검증을 모두 담는다.

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

export function validateCreateItemDto(body: unknown): {
  name: string;
  quantity: number;
} {
  if (typeof body !== 'object' || body === null) {
    throw ['body must be an object'];
  }
  const b = body as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof b.name !== 'string') {
    errors.push('name must be a string');
  } else if (b.name.trim().length === 0) {
    errors.push('name must not be empty');
  }

  let quantity = 0;
  if (b.quantity !== undefined) {
    if (
      typeof b.quantity !== 'number' ||
      !Number.isInteger(b.quantity) ||
      b.quantity < 0
    ) {
      errors.push('quantity must be a non-negative integer');
    } else {
      quantity = b.quantity;
    }
  }

  if (errors.length > 0) {
    throw errors;
  }
  return { name: (b.name as string).trim(), quantity };
}

export function validateAmount(body: unknown): number {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const amount = b.amount;
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1) {
    throw 'amount must be a positive integer';
  }
  return amount;
}

// ── Repository ─────────────────────────────────────────────────────────────
export interface InventoryRepository {
  findAll(): InventoryItem[];
  findById(id: number): InventoryItem | undefined;
  create(name: string, quantity: number): InventoryItem;
  update(id: number, patch: { quantity: number }): InventoryItem | undefined;
  remove(id: number): boolean;
}

export const INVENTORY_REPOSITORY = 'INVENTORY_REPOSITORY';

export class InMemoryInventoryRepository implements InventoryRepository {
  private readonly store = new Map<number, InventoryItem>();
  private nextId = 1;

  findAll(): InventoryItem[] {
    return [...this.store.values()];
  }

  findById(id: number): InventoryItem | undefined {
    return this.store.get(id);
  }

  create(name: string, quantity: number): InventoryItem {
    const item: InventoryItem = { id: this.nextId++, name, quantity };
    this.store.set(item.id, item);
    return item;
  }

  update(id: number, patch: { quantity: number }): InventoryItem | undefined {
    const existing = this.store.get(id);
    if (existing === undefined) {
      return undefined;
    }
    const updated: InventoryItem = { ...existing, quantity: patch.quantity };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: number): boolean {
    return this.store.delete(id);
  }
}

// ── Service ────────────────────────────────────────────────────────────────
@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY) private readonly repo: InventoryRepository,
  ) {}

  findAll(): InventoryItem[] {
    return this.repo.findAll();
  }

  findOne(id: number): InventoryItem {
    const item = this.repo.findById(id);
    if (item === undefined) {
      throw new NotFoundException(`Item #${id} not found`);
    }
    return item;
  }

  create(name: string, quantity: number): InventoryItem {
    return this.repo.create(name, quantity);
  }

  restock(id: number, amount: number): InventoryItem {
    const item = this.findOne(id);
    const updated = this.repo.update(id, { quantity: item.quantity + amount });
    // findOne 이 존재를 보장하므로 update 는 항상 성공한다.
    return updated as InventoryItem;
  }

  ship(id: number, amount: number): InventoryItem {
    const item = this.findOne(id);
    if (amount > item.quantity) {
      throw new BadRequestException(
        `cannot ship ${amount}: only ${item.quantity} in stock`,
      );
    }
    const updated = this.repo.update(id, { quantity: item.quantity - amount });
    return updated as InventoryItem;
  }

  remove(id: number): void {
    const ok = this.repo.remove(id);
    if (!ok) {
      throw new NotFoundException(`Item #${id} not found`);
    }
  }
}

// ── Controller ───────────────────────────────────────────────────────────
@Controller('items')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  findAll(): InventoryItem[] {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): InventoryItem {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateItemDto): InventoryItem {
    let validated: { name: string; quantity: number };
    try {
      validated = validateCreateItemDto(body);
    } catch (errors) {
      throw new BadRequestException(errors as string[]);
    }
    return this.service.create(validated.name, validated.quantity);
  }

  @Patch(':id/restock')
  restock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AmountDto,
  ): InventoryItem {
    let amount: number;
    try {
      amount = validateAmount(body);
    } catch (message) {
      throw new BadRequestException(message as string);
    }
    return this.service.restock(id, amount);
  }

  @Patch(':id/ship')
  ship(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AmountDto,
  ): InventoryItem {
    let amount: number;
    try {
      amount = validateAmount(body);
    } catch (message) {
      throw new BadRequestException(message as string);
    }
    return this.service.ship(id, amount);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): void {
    this.service.remove(id);
  }
}

// ── Module ─────────────────────────────────────────────────────────────────
@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    { provide: INVENTORY_REPOSITORY, useClass: InMemoryInventoryRepository },
  ],
})
export class InventoryModule {}
