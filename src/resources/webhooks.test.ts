import { describe, expect, it, vi } from 'vitest';
import { Webhooks } from './webhooks';

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
});
