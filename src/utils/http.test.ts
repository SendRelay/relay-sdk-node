import * as crypto from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from './http';

function createClient() {
  return new HttpClient({
    baseUrl: 'https://api.example.test',
    apiVersion: 'v1',
    apiKey: 'sk_test_abc',
    timeout: 1000,
    retry: {
      enabled: false,
      maxRetries: 0,
      initialDelayMs: 1,
      maxDelayMs: 1,
      backoffMultiplier: 1,
      retryableStatusCodes: [],
    },
    idempotency: { autoGenerate: false },
    headers: {},
  });
}

function respondWith(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('HttpClient responses', () => {
  it('returns paginated responses intact instead of unwrapping their data array', async () => {
    const page = { data: [{ id: 't1' }], hasMore: true, cursor: 'next' };
    respondWith(page);

    await expect(createClient().get('/sdk/tasks')).resolves.toEqual(page);
  });

  it('returns plain DTOs as sent', async () => {
    const quote = { total: 500000, quoteId: 'q_1', task: { taskType: 'ERRAND' } };
    respondWith(quote);

    await expect(createClient().post('/sdk/tasks/quote', {})).resolves.toEqual(quote);
  });
});

describe('HttpClient.verifyWebhookSignature', () => {
  // Same scheme as the server: HMAC-SHA256 over "<timestamp>.<body>" with the
  // base64url-decoded secret, sent as "t=<timestamp>,v1=<hex>".
  const secret = `whsec_${crypto.randomBytes(32).toString('base64url')}`;
  const body = '{"type":"task.status.completed"}';
  const sign = (payload: string, timestamp = Math.floor(Date.now() / 1000)) =>
    `t=${timestamp},v1=${crypto
      .createHmac('sha256', Buffer.from(secret.slice('whsec_'.length), 'base64url'))
      .update(`${timestamp}.${payload}`)
      .digest('hex')}`;

  it('accepts a server-signed payload', () => {
    expect(createClient().verifyWebhookSignature(body, sign(body), secret)).toEqual({
      valid: true,
    });
  });

  it('rejects tampered bodies, truncated signatures and stale timestamps', () => {
    const client = createClient();
    expect(client.verifyWebhookSignature(`${body} `, sign(body), secret).valid).toBe(false);
    expect(client.verifyWebhookSignature(body, sign(body).slice(0, -4), secret).valid).toBe(false);
    expect(
      client.verifyWebhookSignature(body, sign(body, Math.floor(Date.now() / 1000) - 3600), secret)
        .valid,
    ).toBe(false);
  });
});

describe('HttpClient retries', () => {
  function createRetryingClient() {
    return new HttpClient({
      baseUrl: 'https://api.example.test',
      apiVersion: 'v1',
      apiKey: 'sk_test_abc',
      timeout: 1000,
      retry: {
        enabled: true,
        maxRetries: 2,
        initialDelayMs: 1,
        maxDelayMs: 1,
        backoffMultiplier: 1,
        retryableStatusCodes: [429],
      },
      idempotency: { autoGenerate: false },
      headers: {},
    });
  }

  function respondWith429(code: string) {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { code, message: 'limited' } }), { status: 429 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('does not retry test-mode quota errors', async () => {
    const fetchMock = respondWith429('TEST_QUOTA_EXCEEDED');
    await expect(createRetryingClient().post('/sdk/tasks', {})).rejects.toMatchObject({
      code: 'TEST_QUOTA_EXCEEDED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('still retries burst rate limits', async () => {
    const fetchMock = respondWith429('RATE_LIMITED');
    await expect(createRetryingClient().post('/sdk/tasks', {})).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
