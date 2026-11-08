/**
 * Event log types: GET /v1/sdk/events and GET /v1/sdk/tasks/{taskId}/events
 *
 * @module types/event
 */

import type { ISOTimestamp } from './common';
import type { SubscribableWebhookEventType, WebhookEventType, WebhookMode } from './webhook';

/**
 * One event, exactly as its webhook carried it (same `id`, `type`, `timestamp` and `data`).
 * Task events carry `data.revision`; amounts carry `data.currency`. Kept for 30 days.
 */
export interface RelayEvent {
  id: string;
  type: WebhookEventType;
  /** API version, e.g. `v1` */
  version: string;
  timestamp: ISOTimestamp;
  data: Record<string, unknown> & { revision?: number; currency?: 'NGN' };
  metadata: {
    developerId: string;
    taskId?: string;
    riderId?: string;
    source: string;
    mode: WebhookMode;
  };
}

/** Filters for `relay.events.list` */
export interface ListEventsRequest {
  /** Maximum number of results (max: 30) */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
  /** Sort order by time. Use `asc` to catch up after an outage */
  order?: 'asc' | 'desc';
  /** Only these event types */
  types?: SubscribableWebhookEventType[];
}

/** A page of events */
export interface ListEventsResponse {
  data: RelayEvent[];
  hasMore: boolean;
  cursor: string | null;
}

/** Every event about one task, oldest first */
export interface TaskEventsResponse {
  data: RelayEvent[];
}
