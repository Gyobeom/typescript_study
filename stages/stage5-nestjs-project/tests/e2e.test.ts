// e2e 테스트 — Day 5
// Test.createTestingModule 로 전체 앱을 조립하고 supertest로 HTTP를 때린다.
// 실제 포트를 열지 않고(app.getHttpServer()) 인메모리로 요청을 흘려보낸다.
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@stage5/app.module';

describe('Day 1~5 — Todos e2e (CRUD 전체 흐름)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /todos 는 처음에 빈 배열', async () => {
    const res = await request(app.getHttpServer()).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /todos 는 201과 생성된 Todo를 반환한다', async () => {
    const res = await request(app.getHttpServer())
      .post('/todos')
      .send({ title: 'buy milk' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'buy milk', completed: false });
    expect(typeof res.body.id).toBe('number');
  });

  it('POST /todos 는 빈 title 에 400을 반환한다', async () => {
    const res = await request(app.getHttpServer())
      .post('/todos')
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('GET /todos/:id 는 단건을 반환하고, 없으면 404', async () => {
    const created = await request(app.getHttpServer())
      .post('/todos')
      .send({ title: 'read book' });
    const id = created.body.id;

    const found = await request(app.getHttpServer()).get(`/todos/${id}`);
    expect(found.status).toBe(200);
    expect(found.body.title).toBe('read book');

    const missing = await request(app.getHttpServer()).get('/todos/99999');
    expect(missing.status).toBe(404);
  });

  it('PATCH /todos/:id 는 completed 를 갱신한다', async () => {
    const created = await request(app.getHttpServer())
      .post('/todos')
      .send({ title: 'workout' });
    const id = created.body.id;

    const patched = await request(app.getHttpServer())
      .patch(`/todos/${id}`)
      .send({ completed: true });
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({ id, title: 'workout', completed: true });
  });

  it('PATCH /todos/:id 는 없는 id에 404', async () => {
    const res = await request(app.getHttpServer())
      .patch('/todos/99999')
      .send({ completed: true });
    expect(res.status).toBe(404);
  });

  it('DELETE /todos/:id 는 204, 재삭제 시 404', async () => {
    const created = await request(app.getHttpServer())
      .post('/todos')
      .send({ title: 'temp' });
    const id = created.body.id;

    const del = await request(app.getHttpServer()).delete(`/todos/${id}`);
    expect(del.status).toBe(204);

    const again = await request(app.getHttpServer()).delete(`/todos/${id}`);
    expect(again.status).toBe(404);
  });
});
