import { describe, expect, it, vi } from 'vitest';
import { Presence } from './presence';

describe('Presence resource', () => {
  it('requests presence around a point with the chosen resolution', async () => {
    const http = { get: vi.fn().mockResolvedValue({ cells: [] }) };

    await new Presence(http as any).get({ latitude: 6.5244, longitude: 3.3792, resolution: 'DISTRICT' });

    expect(http.get).toHaveBeenCalledWith('/sdk/presence', {
      params: { latitude: 6.5244, longitude: 3.3792, resolution: 'DISTRICT' },
    });
  });
});
