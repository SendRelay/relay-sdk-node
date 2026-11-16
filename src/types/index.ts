/**
 * TypeScript type definitions for the SendRelay SDK
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

// Errand types
export type {
	WorkStageType,
	IfUnavailable,
	PayWith,
	CustomEffort,
	QuestionType,
	StageFailureReason,
	StageSkipReason,
	PurchaseItem,
	ErrandQuestion,
	MerchantAccount,
	StageSimulate,
	OpeningHours,
	WorkStageFields,
	ApprovalsPolicy,
	PurchaseItemResult,
	StageResult,
	ApprovalKind,
	ApprovalStatus,
	Approval,
	ApprovalDecisionRequest,
	ListApprovalsResponse,
	ErrandSummary,
	ErrandBillLine,
	ErrandQuotePricing,
	ErrandFinalBill,
	ErrandPricing,
	TaskSchedule,
	ErrandWarningCode,
	ErrandWarning,
	ErrandOptions,
	FileViewResponse,
} from './errand';

// Task types
export type {
	TaskType,
	PooledWave,
	PooledWindowRequest,
	PooledState,
	TaskPooledWindow,
	PooledQuoteWindow,
	TaskStatus,
	Priority,
	StageType,
	StageStatus,
	Weight,
	Size,
	VehicleType,
	RiderEquipment,
	TaskRequirements,
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
	TaskLiveEta,
	TaskRating,
	DisputeRequest,
	DisputeTaskResponse,
	AvailableRider,
	AvailableRidersRequest,
	AvailableRidersResponse,
	TaskCompletionCode,
	CompletionCodeRequest,
	DispatchStrategy,
	DispatchRequest,
	TaskDispatch,
	SimulateAdvanceResponse,
	DispatchOptions,
	StageContact,
	UpdateTaskRequest,
	TrackingLinkRequest,
	TrackingLinkResponse,
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
	RedeliverWebhookRequest,
	RedeliverWebhookResponse,
} from './webhook';

// Event log types
export type {
	RelayEvent,
	ListEventsRequest,
	ListEventsResponse,
	TaskEventsResponse,
} from './event';

// Insurance claim types
export type {
	Claim,
	ClaimFile,
	ClaimFileContentType,
	ClaimIncidentType,
	ClaimState,
	ClaimStatus,
	ClaimUpload,
	CreateClaimUploadRequest,
	FileClaimRequest,
	RespondToClaimRequest,
} from './claim';
