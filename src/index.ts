/**
 * Relay SDK for Node.js - Server SDK
 *
 * Official **server-side** SDK for integrating with the Relay delivery platform from Node.js applications.
 *
 * **⚠️ Server-Side Only:** This SDK requires a server-side API key and should never be used in
 * browser/frontend applications. For client-side applications, use:
 * - Browser applications: @relay-sdk/sdk-browser (Browser SDK)
 * - Mobile applications: relay_flutter (Mobile SDK)
 *
 * @example Server-Side Task Creation
 * ```typescript
 * import { RelayClient } from '@relay-sdk/sdk-node';
 *
 * // Initialize with server-side API key (keep secure!)
 * const relay = new RelayClient({
 *   apiKey: process.env.RELAY_API_KEY, // Server-side only!
 * });
 *
 * // Create a delivery task
 * const result = await relay.tasks.create({
 *   taskType: 'PACKAGE_DELIVERY',
 *   stages: [
 *     {
 *       type: 'PICKUP',
 *       location: { latitude: 6.5244, longitude: 3.3792, address: 'Pickup' },
 *       instructions: 'Call on arrival',
 *       items: [{ name: 'Package', estimatedValue: 100000, estimatedWeight: 'STANDARD', estimatedSize: 'BOX' }],
 *     },
 *     {
 *       type: 'DROPOFF',
 *       location: { latitude: 6.4281, longitude: 3.4219, address: 'Dropoff' },
 *       instructions: 'Leave at front desk',
 *     },
 *   ],
 * });
 * ```
 *
 * @example Generate WebSocket Token for Client
 * ```typescript
 * // Generate token for frontend client to track task
 * const { token } = await relay.auth.createWebSocketToken({
 *   scope: [`task:${result.task.taskId}`],
 *   expiresIn: 3600, // 1 hour
 * });
 *
 * // Send token to frontend (e.g., via API endpoint)
 * res.json({ wsToken: token });
 * ```
 *
 * @packageDocumentation
 * @module @relay-sdk/sdk-node
 */

// Main client
export { RelayClient, type RelayClientOptions } from './client';

// Default export
export { RelayClient as default } from './client';

// Error classes
export {
	RelayError,
	ApiError,
	NetworkError,
	ValidationError,
} from './errors';

// Type definitions
export type {
	// Common types
	Location,
	Contact,
	PaginationMeta,
	PaginatedResponse,
	ApiResponse,
	ISOTimestamp,
	UUID,
	AmountInKobo,
	// Task types
	TaskType,
	TaskStatus,
	Priority,
	StageType,
	StageStatus,
	Weight,
	Size,
	VehicleType,
	PaymentStatus,
	PaymentMethod,
	Item,
	Passenger,
	Stage,
	Preferences,
	RiderRatingSummary,
	RiderVehicleSummary,
	RiderSnippet,
	Task,
	TaskWithRider,
	TaskRecord,
	CreateTaskRequest,
	CreateTaskResponse,
	TaskQuoteRequest,
	PricingBreakdown,
	TaskQuoteResponse,
	ListTasksRequest,
	TaskListItem,
	ListTasksResponse,
	GetTaskResponse,
	ManualAssignRequest,
	ManualAssignResponse,
	CancelTaskRequest,
	CancelTaskResponse,
	RatingRequest,
	SubmitRatingResponse,
	DisputeRequest,
	DisputeTaskResponse,
	AvailableRider,
	AvailableRidersRequest,
	AvailableRidersResponse,
	// Webhook types
	SubscribableWebhookEventType,
	VerificationWebhookEventType,
	WebhookEventType,
	WebhookMode,
	Webhook,
	CreateWebhookResponse,
	CreateWebhookRequest,
	UpdateWebhookRequest,
	ListWebhooksResponse,
	WebhookSignatureVerification,
} from './types';

// Auth types
export type {
	CreateWebSocketTokenRequest,
	WebSocketToken,
} from './resources/auth';
