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
	| 'task.status.completed'
	| 'task.status.failed'
	| 'task.status.cancelled'
	| 'task.stage.completed'
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
export type WebhookEventType = SubscribableWebhookEventType | VerificationWebhookEventType;

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
	cursor?: string;
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
