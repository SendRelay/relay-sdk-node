/**
 * Task-related types
 *
 * @module types/task
 */

import type { AmountInKobo, ISOTimestamp, Location, UUID } from './common';

/**
 * Type of delivery task
 */
export type TaskType =
  | 'PASSENGER_RIDE'
  | 'FOOD_DELIVERY'
  | 'PACKAGE_DELIVERY'
  | 'BULK_DELIVERY'
  | 'ERRAND';

/**
 * Task lifecycle status
 */
export type TaskStatus =
  | 'PENDING'
  | 'OFFERED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'PAYMENT_FAILED';

/**
 * Task priority level
 */
export type Priority = 'STANDARD' | 'URGENT';

/**
 * Stage type in a task
 */
export type StageType = 'PICKUP' | 'DROPOFF';

/**
 * Stage completion status
 */
export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

/**
 * Item weight category
 */
export type Weight = 'LIGHT' | 'STANDARD' | 'HEAVY' | 'FREIGHT';

/**
 * Item size category
 */
export type Size = 'ENVELOPE' | 'BOX' | 'LARGE_BOX' | 'FREIGHT';

/**
 * Vehicle type for delivery preferences
 */
export type VehicleType = 'BICYCLE' | 'MOTORCYCLE' | 'TRICYCLE' | 'CAR' | 'TRUCK';

/**
 * Payment status for a task
 */
export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUNDED'
  | 'SPLIT';

/**
 * Payment method
 */
export type PaymentMethod = 'WALLET' | 'CARD' | 'TEST';

/**
 * Item being delivered
 */
export interface Item {
  /** Item name/description */
  name: string;
  /** Additional description */
  description?: string;
  /** Estimated value in kobo (for insurance calculation) */
  estimatedValue: AmountInKobo;
  /** Weight category */
  estimatedWeight: Weight;
  /** Size category */
  estimatedSize: Size;
  /** Additional handling instructions */
  specialInstructions?: string;
}

/**
 * Passenger information (for PASSENGER_RIDE tasks)
 */
export interface Passenger {
  /** Passenger name */
  name: string;
  /** Contact information */
  contactInfo?: string;
  /** Special needs or requests */
  specialNeeds?: string;
  /** Number of luggage items */
  luggageCount?: number;
}

/**
 * Task stage (pickup or dropoff location)
 */
export interface Stage {
  /** Stage type */
  type: StageType;
  /** Location */
  location: Location;
  /** Special instructions for the rider */
  instructions: string;
  /** Items in this stage (cargo tasks) */
  items?: Item[];
  /** Passengers in this stage (passenger tasks) */
  passengers?: Passenger[];
  /** Stage status */
  status?: StageStatus;
  /** Completion timestamp */
  completedAt?: ISOTimestamp | null;
  /** Completion photo URL */
  completionPhoto?: string | null;
  /** Completion notes */
  completionNotes?: string | null;
}

/**
 * Task preferences (rider requirements)
 */
export interface Preferences {
  /** Minimum rider rating (1-5) */
  minRating?: number | null;
  /** Requires insulated box */
  hasBox?: boolean | null;
  /** Requires refrigeration */
  hasRefrigeration?: boolean | null;
  /** Requires air conditioning */
  hasAirConditioning?: boolean | null;
  /** Allowed vehicle types */
  vehicleType?: VehicleType[] | null;
  /** Allowed fleet organisations */
  allowedOrganisations?: string[];
  /** Blocked fleet organisations */
  blockedOrganisations?: string[];
  /** Whether independent riders are allowed */
  allowIndependentRiders?: boolean;
}

/**
 * Rider rating summary
 */
export interface RiderRatingSummary {
  average: number;
  totalReviews: number;
}

/**
 * Rider vehicle summary
 */
export interface RiderVehicleSummary {
  type: VehicleType | null;
  plateNumber: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  hasRefrigeration: boolean | null;
  hasAirConditioning: boolean | null;
  hasBox: boolean | null;
  maxPayloadKg: number | null;
}

/**
 * Rider snippet used in task details
 */
export interface RiderSnippet {
  id: UUID;
  firstName: string;
  lastName: string;
  phone: string;
  photo: string | null;
  riderStatus: 'SUSPENDED' | 'UNVERIFIED' | 'ACTIVE';
  vehicle: RiderVehicleSummary | null;
  rating: RiderRatingSummary;
  isSuspended: boolean;
}

/**
 * Complete task object returned by API
 */
export interface Task {
  /** Unique task ID */
  id: UUID;
  /** Developer who created the task */
  developerId: UUID;
  /** Assigned rider ID */
  riderId: UUID | null;
  /** External reference ID */
  externalId: string | null;
  /** Current task status */
  status: TaskStatus;
  /** Task type */
  taskType: TaskType;
  /** Priority level */
  priority: Priority;
  /** Whether auto-assignment is enabled */
  autoAssign: boolean;
  /** Current stage index */
  currentStageIndex: number | null;
  /** Additional notes */
  notes: string | null;
  /** Task preferences */
  preferences: Preferences | null;
  /** Task stages */
  stages: Stage[];
  /** Delivery fee in kobo */
  deliveryFee: AmountInKobo;
  /** Total fee including taxes and fees in kobo */
  totalFee: AmountInKobo;
  /** Payment status */
  paymentStatus: PaymentStatus | null;
  /** Payment method */
  paymentMethod: PaymentMethod;
  /** Parsed pricing object */
  pricing: Record<string, unknown> | null;
  /** Creation timestamp */
  createdAt: ISOTimestamp;
  /** Last update timestamp */
  updatedAt: ISOTimestamp;
  /** Offered to riders timestamp */
  offeredAt: ISOTimestamp | null;
  /** Accepted by rider timestamp */
  acceptedAt: ISOTimestamp | null;
  /** Assigned to rider timestamp */
  assignedAt: ISOTimestamp | null;
  /** Completion timestamp */
  completedAt: ISOTimestamp | null;
  /** Failed timestamp */
  failedAt: ISOTimestamp | null;
  /** Cancellation timestamp */
  cancelledAt: ISOTimestamp | null;
  /** Failure reason */
  failureReason: string | null;
}

/**
 * Task with rider details
 */
export type TaskWithRider = Task & { rider: RiderSnippet };

/**
 * Raw task entity shape returned by create/assign endpoints
 */
export interface TaskRecord {
  id: UUID;
  developerId: UUID;
  riderId?: UUID | null;
  externalId?: string | null;
  status: TaskStatus;
  taskType: TaskType;
  priority: Priority;
  autoAssign?: boolean;
  stages: Stage[];
  deliveryFee: AmountInKobo;
  totalFee: AmountInKobo;
  pricing: string;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: PaymentMethod;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  offeredAt?: ISOTimestamp;
  acceptedAt?: ISOTimestamp;
  assignedAt?: ISOTimestamp;
  completedAt?: ISOTimestamp;
  failedAt?: ISOTimestamp;
  cancelledAt?: ISOTimestamp;
  notes?: string;
  idempotencyKey?: string;
  [key: string]: unknown;
}

/**
 * Request to create a new task
 */
export interface CreateTaskRequest {
  /** Task type */
  taskType: TaskType;
  /** Priority (default: STANDARD) */
  priority?: Priority;
  /** Task stages */
  stages: Stage[];
  /** Enable auto-assignment (default: true) */
  autoAssign?: boolean;
  /** Payment method (default: WALLET) */
  paymentMethod?: Extract<PaymentMethod, 'WALLET' | 'CARD'>;
  /** Additional notes */
  notes?: string;
  /** External reference ID */
  externalId?: string;
  /** Quote lock identifier returned by tasks.quote */
  quoteId?: string;
  /** Idempotency key (alternative to header) */
  idempotencyKey?: string;
  /** Task preferences */
  preferences?: Preferences;
  /** Test-mode simulation outcome */
  simulationOutcome?:
    | 'SUCCESS'
    | 'NO_RIDERS'
    | 'TIER_1_TIMEOUT'
    | 'TIER_2_TIMEOUT'
    | 'TIER_3_TIMEOUT'
    | 'RANDOM'
    | 'CANCEL_BEFORE_ACCEPT'
    | 'CANCEL_AFTER_ACCEPT';
}

/**
 * Pricing breakdown from quote/create responses
 */
export interface PricingBreakdown {
  /** Total amount in kobo */
  total: AmountInKobo;
  /** Subtotal amount in kobo */
  subtotal: AmountInKobo;
  /** Tax amount in kobo */
  tax: AmountInKobo;
  /** Platform fee in kobo */
  platformFee: AmountInKobo;
  /** Priority fee in kobo */
  priorityFee: AmountInKobo;
}

/**
 * Response from task creation
 */
export interface CreateTaskResponse {
  message: string;
  task: TaskRecord;
  pricing: PricingBreakdown;
  idempotency: {
    key: string;
    duplicate?: boolean;
    validityWindow: string;
  };
  wallet?: {
    balanceAfter: number;
    amountDeducted: number;
  };
  payment?: {
    method: 'CARD';
    status: 'PRE_AUTHORIZED';
    amount: number;
    expiresAt: string;
  };
  simulation?: {
    mode: 'test';
    outcome: string;
    expiresAt: string;
    warning: string;
  };
}

/**
 * Request to get pricing quote
 */
export interface TaskQuoteRequest {
  /** Task type */
  taskType: TaskType;
  /** Priority (default: STANDARD) */
  priority?: Priority;
  /** Task stages */
  stages: Stage[];
}

/**
 * Response from pricing quote request
 */
export type TaskQuoteResponse = PricingBreakdown & {
  task: TaskQuoteRequest;
  quoteId: string;
  expiresAt: string;
  quoteTtlSeconds: number;
};

/**
 * Request to list tasks
 */
export interface ListTasksRequest {
  /** Maximum number of results (max: 30) */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
  /** Sort order by creation time */
  order?: 'asc' | 'desc';
}

/**
 * Lightweight task list item
 */
export interface TaskListItem {
  id: UUID;
  developerId: UUID;
  riderId: UUID | null;
  externalId: string | null;
  status: TaskStatus;
  taskType: TaskType;
  priority: Priority;
  autoAssign: boolean;
  stages: number;
  deliveryFee: AmountInKobo;
  totalFee: AmountInKobo;
  createdAt: ISOTimestamp;
}

/**
 * Response from list tasks request
 */
export interface ListTasksResponse {
  /** Array of task snippets */
  data: TaskListItem[];
  /** Whether there are more results */
  hasMore: boolean;
  /** Cursor for next page */
  cursor?: string;
}

/**
 * Response from get task request
 */
export type GetTaskResponse = { task: Task } | TaskWithRider;

/**
 * Request to manually assign a task to a rider
 */
export interface ManualAssignRequest {
  /** Rider ID to assign */
  riderId: UUID;
}

/**
 * Response from manual assign request
 */
export interface ManualAssignResponse {
  message: string;
  taskId: UUID;
  riderId: UUID;
  status: 'OFFERED';
  task: TaskRecord;
}

/**
 * Request to cancel a task
 */
export interface CancelTaskRequest {
  /** Cancellation reason (optional) */
  reason?: string;
}

/**
 * Response from cancel task request
 */
export interface CancelTaskResponse {
  message: string;
  taskId: UUID;
  status: 'CANCELLED';
}

/**
 * Request to submit a rating
 */
export interface RatingRequest {
  /** Rating (1-5) */
  rating: number;
  /** Optional comment */
  comment?: string;
}

/**
 * Response from submit rating request
 */
export interface SubmitRatingResponse {
  ratingId: UUID;
  rating: number;
  comment?: string;
}

/**
 * Request to dispute a task
 */
export interface DisputeRequest {
  /** Dispute reason */
  reason:
    | 'NOT_DELIVERED'
    | 'DAMAGED_ITEMS'
    | 'WRONG_LOCATION'
    | 'INCOMPLETE_DELIVERY'
    | 'POOR_SERVICE'
    | 'OTHER';
  /** Detailed description (min 10 characters) */
  description: string;
  /** Evidence URLs (photos/documents) */
  evidence?: string[];
}

/**
 * Response from dispute task request
 */
export interface DisputeTaskResponse {
  message: string;
  disputeId: UUID;
  status: 'PENDING_REVIEW';
  note: string;
  reviewTimeframe: string;
}

/**
 * Available rider information
 */
export interface AvailableRider {
  /** Rider ID */
  riderId: UUID;
  /** Rider first name */
  firstName: string;
  /** Rider profile photo */
  photo: string | null;
  /** Rider location */
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    bearing?: number | null;
    speed?: number | null;
    altitude?: number | null;
    heading?: number | null;
    updatedAt?: string | null;
  } | null;
  /** Rider vehicle details */
  vehicle: RiderVehicleSummary | null;
  /** Rider rating */
  rating: RiderRatingSummary;
}

/**
 * Request to get available riders
 */
export interface AvailableRidersRequest {
  /** Offer tier (1-3). Defaults to 1. */
  tier?: 1 | 2 | 3;
}

/**
 * Response with available riders
 */
export type AvailableRidersResponse = AvailableRider[];
