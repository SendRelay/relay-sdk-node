/**
 * Event log: every event Relay sent (or would have sent) to your webhooks, kept for 30 days.
 *
 * @module resources/events
 */

import type { ListEventsRequest, ListEventsResponse, RelayEvent } from '../types';
import type { HttpClient } from '../utils/http';

export class Events {
  constructor(private readonly http: HttpClient) {}

  /**
   * List events for your account and the key's mode, newest first by default.
   *
   * @example
   * ```typescript
   * // Catch up after an outage, oldest first.
   * const page = await relay.events.list({ order: 'asc', types: ['task.status.completed'] });
   * ```
   */
  async list(request?: ListEventsRequest): Promise<ListEventsResponse> {
    const { types, ...rest } = request ?? {};
    const params = types && types.length > 0 ? { ...rest, types: types.join(',') } : rest;
    return this.http.get<ListEventsResponse>('/sdk/events', { params });
  }

  /**
   * Every event matching the filters, following the cursor for you.
   *
   * @example
   * ```typescript
   * for await (const event of relay.events.listAll({ order: 'asc' })) {
   *   await handle(event); // the same handler as your webhook endpoint
   * }
   * ```
   */
  async *listAll(request?: ListEventsRequest): AsyncIterableIterator<RelayEvent> {
    let cursor: string | undefined;
    do {
      const response = await this.list({ ...request, cursor });
      for (const event of response.data) yield event;
      cursor = response.hasMore ? (response.cursor ?? undefined) : undefined;
    } while (cursor);
  }
}
