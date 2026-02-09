import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface OrderResponse {
  status: string;
  id: string;
}

describe('POST /webhook/orders (e2e)', () => {
  let app: INestApplication<App>;
  const baseOrderPayload = {
    customer: { email: 'user@example.com', name: 'Ana' },
    items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
    currency: 'USD',
  };

  const mockFetchResponse = (payload: unknown, ok = true) =>
    Promise.resolve({
      ok,
      json: () => payload,
    } as unknown as { ok: boolean; json: () => Promise<unknown> });

  const useDefaultFetchMock = () => {
    const mockFetch = jest.fn(async (input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('frankfurter.app')) {
        return mockFetchResponse({
          rates: { BRL: 1, USD: 0.2, EUR: 0.18 },
          date: '2026-02-09',
        });
      }
      if (url.includes('viacep.com.br')) {
        return mockFetchResponse({
          cep: '29100560',
        });
      }
      return mockFetchResponse({}, false);
    });

    global.fetch = mockFetch as unknown as typeof fetch;
    return mockFetch;
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates an order', async () => {
    useDefaultFetchMock();
    const payload = {
      ...baseOrderPayload,
      order_id: 'ext-123',
      idempotency_key: 'uuid-or-hash',
    };

    const created = await request(app.getHttpServer())
      .post('/webhook/orders')
      .send(payload)
      .expect(201);

    expect((created.body as OrderResponse).status).toBe('received');
    expect((created.body as OrderResponse).id).toBeTruthy();
  });

  it('rejects duplicate idempotency key', async () => {
    useDefaultFetchMock();
    const payload = {
      ...baseOrderPayload,
      order_id: `ext-${Date.now()}-dup`,
      idempotency_key: `key-${Date.now()}-dup`,
    };

    await request(app.getHttpServer())
      .post('/webhook/orders')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/webhook/orders')
      .send(payload)
      .expect(400);
  });
});
