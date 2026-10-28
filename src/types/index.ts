/**
 * TypeScript type definitions for the Relay SDK
 *
 * @module types
 */

// Common types
export type {
	Location,
	Contact,
	PaginationMeta,
	PaginatedResponse,
	ApiResponse,
	ISOTimestamp,
	UUID,
	AmountInKobo,
} from './common';

// Task types
export type {
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
	TaskCompletionCode,
	CompletionCodeRequest,
} from './task';

// Presence types
export type {
	PresenceResolution,
	PresenceDensity,
	PresencePoint,
	PresenceCell,
	PresenceRequest,
	PresenceResponse,
} from './presence';

// Webhook types
export type {
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
} from './webhook';
