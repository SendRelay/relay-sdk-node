import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../errors';
import { Auth } from './auth';

describe('Auth resource', () => {
  it('throws when scope is empty', async () => {
    const request = vi.fn();
    const auth = new Auth({ request } as any);

    await expect(auth.createWebSocketToken({ scope: [] })).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws for invalid scope format', async () => {
    const request = vi.fn();
    const auth = new Auth({ request } as any);

    await expect(auth.createWebSocketToken({ scope: ['task123'] })).rejects.toBeInstanceOf(
      ValidationError,
    );

    await expect(auth.createWebSocketToken({ scope: ['task:abc:def'] })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('throws when scoped task IDs exceed backend max', async () => {
    const request = vi.fn();
    const auth = new Auth({ request } as any);

    await expect(
      auth.createWebSocketToken({
        scope: ['task:t1,t2,t3,t4,t5,t6'],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws when expiresIn is outside valid range', async () => {
    const request = vi.fn();
    const auth = new Auth({ request } as any);

    await expect(
      auth.createWebSocketToken({ scope: ['task:abc'], expiresIn: 59 }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      auth.createWebSocketToken({ scope: ['task:abc'], expiresIn: 7201 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('posts scope payload with default expiresIn', async () => {
    const response = {
      token: 'jwt-token',
      expiresIn: 1800,
      expiresAt: '2026-05-11T00:00:00.000Z',
      scope: ['task:abc'],
    };
    const request = vi.fn().mockResolvedValue(response);
    const auth = new Auth({ request } as any);

    const result = await auth.createWebSocketToken({ scope: ['task:abc'] });

    expect(request).toHaveBeenCalledWith('POST', '/auth/websocket-token', {
      scope: ['task:abc'],
      expiresIn: 1800,
    });
    expect(result).toEqual(response);
  });
});
