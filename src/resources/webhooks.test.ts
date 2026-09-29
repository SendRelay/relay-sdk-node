import { afterEach, describe, expect, it, vi } from 'vitest';
import { RelayClient } from '../client';
import { Webhooks } from './webhooks';

afterEach(() => vi.unstubAllGlobals());

describe('Webhooks resource', () => {
  it('uses SDK API-key auth by default for webhook management calls', async () => {
    const http = {
      post: vi.fn().mockResolvedValue({ id: 'wh_123' }),
      get: vi.fn().mockResolvedValue({ data: [] }),
      put: vi.fn().mockResolvedValue({ id: 'wh_123' }),
      delete: vi.fn().mockResolvedValue({ id: 'wh_123' }),
    };
    const webhooks = new Webhooks(http as any);

    await webhooks.create({ url: 'https://example.com/relay', events: [] });
    await webhooks.list();
    await webhooks.get('wh_123');
    await webhooks.update('wh_123', { description: 'Updated' });
    await webhooks.delete('wh_123');

    expect(http.post).toHaveBeenCalledWith(
      '/sdk/webhooks',
      {
        url: 'https://example.com/relay',
        events: [],
      },
      undefined,
    );
    expect(http.get).toHaveBeenCalledWith('/sdk/webhooks', undefined);
    expect(http.get).toHaveBeenCalledWith('/sdk/webhooks/wh_123', undefined);
    expect(http.put).toHaveBeenCalledWith(
      '/sdk/webhooks/wh_123',
      { description: 'Updated' },
      undefined,
    );
    expect(http.delete).toHaveBeenCalledWith('/sdk/webhooks/wh_123', undefined);
  });

  it('can still send a dashboard developer token override', async () => {
    const http = {
      get: vi.fn().mockResolvedValue({ data: [] }),
    };
    const webhooks = new Webhooks(http as any);

    await webhooks.list({ developerToken: 'developer-jwt' });

    expect(http.get).toHaveBeenCalledWith('/sdk/webhooks', {
      headers: { Authorization: 'Bearer developer-jwt' },
    });
  });

  it('sends every CRUD request to the SDK route with X-Relay-Key and no developer token', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify({ data: { id: 'wh_123' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const relay = new RelayClient({
      apiKey: 'sk_test_fixture',
      baseUrl: 'https://api.example.test',
    });

    await relay.webhooks.create({
      url: 'https://receiver.example.test/relay',
      mode: 'test',
      events: ['task.status.completed'],
    });
    await relay.webhooks.list();
    await relay.webhooks.get('wh_123');
    await relay.webhooks.update('wh_123', { description: 'Updated' });
    await relay.webhooks.delete('wh_123');

    expect(fetchMock.mock.calls.map(([url, request]) => [request.method, url])).toEqual([
      ['POST', 'https://api.example.test/v1/sdk/webhooks'],
      ['GET', 'https://api.example.test/v1/sdk/webhooks'],
      ['GET', 'https://api.example.test/v1/sdk/webhooks/wh_123'],
      ['PUT', 'https://api.example.test/v1/sdk/webhooks/wh_123'],
      ['DELETE', 'https://api.example.test/v1/sdk/webhooks/wh_123'],
    ]);
    for (const [, request] of fetchMock.mock.calls) {
      expect(request.headers['X-Relay-Key']).toBe('sk_test_fixture');
      expect(request.headers.Authorization).toBeUndefined();
    }
  });
});
