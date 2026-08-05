// 복습(인출 연습) 테스트 — 스테이지 5 종합 (NestJS 레이어드)
//
// 단위(Service/Repository/DTO) + e2e(Test.createTestingModule + supertest)를 섞는다.
// e2e 는 실 포트를 열지 않고 app.getHttpServer() 로 인메모리 요청을 흘려보낸다.
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  InventoryModule,
  InventoryService,
  InMemoryInventoryRepository,
  INVENTORY_REPOSITORY,
  validateCreateItemDto,
  validateAmount,
} from '@stage5/review-inventory';

// ── 단위: DTO 수동 검증 ────────────────────────────────────────────────────
describe('복습 스테이지5 — DTO 검증', () => {
  it('유효한 생성 바디는 정규화된 값을 반환한다 (quantity 생략 시 0)', () => {
    expect(validateCreateItemDto({ name: '  볼트  ' })).toEqual({
      name: '볼트',
      quantity: 0,
    });
    expect(validateCreateItemDto({ name: '너트', quantity: 5 })).toEqual({
      name: '너트',
      quantity: 5,
    });
  });

  it('name 이 없거나 빈 문자열이면 메시지 배열을 throw 한다', () => {
    expect(() => validateCreateItemDto({ name: '   ' })).toThrow();
    expect(() => validateCreateItemDto({})).toThrow();
    try {
      validateCreateItemDto({ name: 42 });
      fail('throw 되어야 한다');
    } catch (errors) {
      expect(Array.isArray(errors)).toBe(true);
    }
  });

  it('quantity 가 음수/비정수면 거부한다', () => {
    expect(() => validateCreateItemDto({ name: 'x', quantity: -1 })).toThrow();
    expect(() => validateCreateItemDto({ name: 'x', quantity: 1.5 })).toThrow();
  });

  it('amount 는 양의 정수만 허용한다', () => {
    expect(validateAmount({ amount: 3 })).toBe(3);
    expect(() => validateAmount({ amount: 0 })).toThrow();
    expect(() => validateAmount({ amount: -2 })).toThrow();
    expect(() => validateAmount({ amount: 2.5 })).toThrow();
  });
});

// ── 단위: Service + Repository ─────────────────────────────────────────────
describe('복습 스테이지5 — Service 로직', () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService(new InMemoryInventoryRepository());
  });

  it('생성한 품목을 조회할 수 있다', () => {
    const created = service.create('상자', 10);
    expect(created).toMatchObject({ name: '상자', quantity: 10 });
    expect(service.findOne(created.id)).toEqual(created);
  });

  it('없는 id 조회 시 NotFoundException 을 던진다', () => {
    expect(() => service.findOne(999)).toThrow('Item #999 not found');
  });

  it('restock 은 수량을 늘린다', () => {
    const item = service.create('펜', 2);
    expect(service.restock(item.id, 5).quantity).toBe(7);
  });

  it('ship 은 수량을 줄이고, 재고보다 많으면 BadRequestException', () => {
    const item = service.create('노트', 3);
    expect(service.ship(item.id, 2).quantity).toBe(1);
    expect(() => service.ship(item.id, 5)).toThrow(/only 1 in stock/);
  });

  it('remove 후 재삭제하면 NotFoundException', () => {
    const item = service.create('클립', 1);
    service.remove(item.id);
    expect(() => service.remove(item.id)).toThrow();
  });
});

// ── e2e: 전체 CRUD 흐름 ────────────────────────────────────────────────────
describe('복습 스테이지5 — Inventory e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [InventoryModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /items 는 처음에 빈 배열', async () => {
    const res = await request(app.getHttpServer()).get('/items');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /items 는 201, 빈 name 은 400', async () => {
    const ok = await request(app.getHttpServer())
      .post('/items')
      .send({ name: '망치', quantity: 4 });
    expect(ok.status).toBe(201);
    expect(ok.body).toMatchObject({ name: '망치', quantity: 4 });
    expect(typeof ok.body.id).toBe('number');

    const bad = await request(app.getHttpServer())
      .post('/items')
      .send({ name: '' });
    expect(bad.status).toBe(400);
  });

  it('PATCH restock / ship 흐름과 재고 부족 400', async () => {
    const created = await request(app.getHttpServer())
      .post('/items')
      .send({ name: '드릴', quantity: 1 });
    const id = created.body.id;

    const restocked = await request(app.getHttpServer())
      .patch(`/items/${id}/restock`)
      .send({ amount: 9 });
    expect(restocked.status).toBe(200);
    expect(restocked.body.quantity).toBe(10);

    const shipped = await request(app.getHttpServer())
      .patch(`/items/${id}/ship`)
      .send({ amount: 4 });
    expect(shipped.status).toBe(200);
    expect(shipped.body.quantity).toBe(6);

    const tooMuch = await request(app.getHttpServer())
      .patch(`/items/${id}/ship`)
      .send({ amount: 100 });
    expect(tooMuch.status).toBe(400);
  });

  it('없는 id 에 대한 조회/입고/삭제는 404', async () => {
    expect((await request(app.getHttpServer()).get('/items/99999')).status).toBe(
      404,
    );
    expect(
      (
        await request(app.getHttpServer())
          .patch('/items/99999/restock')
          .send({ amount: 1 })
      ).status,
    ).toBe(404);
    expect(
      (await request(app.getHttpServer()).delete('/items/99999')).status,
    ).toBe(404);
  });

  it('DELETE /items/:id 는 204, 재삭제 시 404', async () => {
    const created = await request(app.getHttpServer())
      .post('/items')
      .send({ name: '임시' });
    const id = created.body.id;

    const del = await request(app.getHttpServer()).delete(`/items/${id}`);
    expect(del.status).toBe(204);

    const again = await request(app.getHttpServer()).delete(`/items/${id}`);
    expect(again.status).toBe(404);
  });
});
