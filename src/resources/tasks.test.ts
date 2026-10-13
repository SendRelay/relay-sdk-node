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

  it('offers a manual assignment to the riders given', async () => {
    const http = { post: vi.fn().mockResolvedValue({ status: 'PENDING' }) };

    await new Tasks(http as any).assign('task_1', {
      riderIds: ['rider_a', 'rider_b'],
      offerTimeoutSeconds: 90,
    });

    expect(http.post).toHaveBeenCalledWith('/sdk/tasks/task_1/assign', {
      riderIds: ['rider_a', 'rider_b'],
      offerTimeoutSeconds: 90,
    });
  });

  it('follows cursors across pages in listAll and stops on the last page', async () => {
    const http = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ data: [{ id: 't1' }], hasMore: true, cursor: 'c1' })
        .mockResolvedValueOnce({ data: [{ id: 't2' }], hasMore: false, cursor: null }),
    };

    const ids: string[] = [];
    for await (const task of new Tasks(http as any).listAll({ limit: 1 })) ids.push(task.id);

    expect(ids).toEqual(['t1', 't2']);
    expect(http.get).toHaveBeenNthCalledWith(2, '/sdk/tasks', {
      params: { limit: 1, cursor: 'c1' },
    });
  });
});
