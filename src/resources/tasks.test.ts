import { describe, expect, it, vi } from 'vitest';
import { Tasks } from './tasks';

describe('Tasks resource', () => {
  it('posts quote payload to /tasks/quote', async () => {
    const http = {
      post: vi.fn().mockResolvedValue({ quoteId: 'q_123' }),
    };

    const tasks = new Tasks(http as any);
    const payload = {
      taskType: 'FOOD_DELIVERY',
      stages: [],
    };

    await tasks.quote(payload as any);

    expect(http.post).toHaveBeenCalledWith('/sdk/tasks/quote', payload);
  });

  it('sends quoteId in create payload and idempotency key in header', async () => {
    const http = {
      post: vi.fn().mockResolvedValue({ message: 'ok' }),
    };

    const tasks = new Tasks(http as any);
    const request = {
      taskType: 'FOOD_DELIVERY',
      quoteId: 'quote_abc',
      stages: [],
    };

    await tasks.create(request as any, { idempotencyKey: 'order_123' });

    expect(http.post).toHaveBeenCalledWith('/sdk/tasks', request, {
      headers: { 'Idempotency-Key': 'order_123' },
    });
  });
});
