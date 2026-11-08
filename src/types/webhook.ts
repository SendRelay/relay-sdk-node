/**
 * Webhook-related types
 *
 * @module types/webhook
 */

import type { ISOTimestamp, UUID } from './common';

/**
 * Webhook event types that can be subscribed to when creating/updating webhooks
 */
export type SubscribableWebhookEventType =
	// Task lifecycle events
	| 'task.status.created'
	| 'task.status.offered'
	| 'task.status.assigned'
	| 'task.status.in_progress'
	| 'task.status.searching'
	| 'task.dispatch.started'
	| 'task.dispatch.riders_nearby'
	| 'task.status.completed'
	| 'task.status.failed'
	| 'task.status.cancelled'
	| 'task.stage.completed'
	| 'task.stage.arrived'
	| 'task.details.updated'
	| 'task.dispatch.rider_unassigned'
	// Payment events
	| 'payment.pending'
	| 'payment.released'
	| 'payment.disputed'
	| 'payment.dispute_resolved';

/**
 * Relay verification probe event type.
 * Sent only during endpoint verification checks and not subscribable.
 */
export type VerificationWebhookEventType = 'webhook.verification.test';

/**
 * Any webhook event type that may be received by an endpoint.
 */
export type WebhookEventType =
	| SubscribableWebhookEventType
	| VerificationWebhookEventType
	// Relay adds event types over time; acknowledge ones you do not handle with a 2xx.
	| (string & {});

/**
 * Webhook mode
 */
export type WebhookMode = 'test' | 'live';

/**
 * Webhook object
 */
export interface Webhook {
	/** Unique webhook ID */
	id: UUID;
	/** Webhook endpoint URL */
	url: string;
	/** test or live mode */
	mode: WebhookMode;
	/** Webhook description */
	description?: string;
	/** Creation timestamp */
	createdAt: ISOTimestamp;
	/** Subscribed event types */
	events: SubscribableWebhookEventType[];
	/** Delivery usage stats */
	usage: {
		successCount: number;
		errorCount: number;
		lastUsed?: ISOTimestamp;
	};
	/** Developer reference */
	developer: {
		id: UUID;
	};
}

/**
 * Response from create webhook request
 */
export interface CreateWebhookResponse {
	id: UUID;
	mode: WebhookMode;
	secret: string;
	url: string;
	events: SubscribableWebhookEventType[];
}

/**
 * Request to create a webhook
 */
export interface CreateWebhookRequest {
	/** Webhook endpoint URL */
	url: string;
	/** Event types to subscribe to */
	events: SubscribableWebhookEventType[];
	/** Optional description */
	description?: string;
	/** live or test mode */
	mode?: WebhookMode;
}

/**
 * Request to update a webhook
 */
export interface UpdateWebhookRequest {
	/** New endpoint URL (must be reachable) */
	url?: string;
	/** Updated event types */
	events?: SubscribableWebhookEventType[];
	/** Updated description */
	description?: string;
}

/**
 * Response from list webhooks
 */
export interface ListWebhooksResponse {
	/** Array of webhooks */
	data: Webhook[];
	/** Whether there are more results */
	hasMore: boolean;
	/** Pagination cursor */
	cursor: string | null;
}

/**
 * Webhook signature verification result
 */
export interface WebhookSignatureVerification {
	/** Whether the signature is valid */
	valid: boolean;
	/** Error message (if valid is false) */
	error?: string;
}

/** Send a logged event to an endpoint again */
export interface RedeliverWebhookRequest {
  /** The event's `id`, from a webhook, `relay.events.list` or `relay.tasks.events` */
  eventId: string;
}

/** The event was queued; it is delivered with the same id and the normal retry schedule */
export interface RedeliverWebhookResponse {
  webhookId: string;
  eventId: string;
  queued: true;
}
