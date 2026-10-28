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
export type VehicleType = 'BICYCLE' | 'BIKE' | 'MOTORCYCLE' | 'TRICYCLE' | 'CAR' | 'VAN' | 'TRUCK';

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
  minRating?: number;
  /** Requires a delivery box; does not guarantee insulation */
  hasBox?: boolean;
  /** Requires refrigeration */
  hasRefrigeration?: boolean;
  /** Requires air conditioning */
  hasAirConditioning?: boolean;
  /** Unordered allowed types; fixed price is the highest complete fare. Empty/omitted defaults to CAR for passengers, MOTORCYCLE otherwise. */
  vehicleType?: VehicleType[];
  /** Better Auth fleet organisation IDs; empty means unrestricted. Independents remain eligible by default. */
  allowedOrganisations?: string[];
  /** Any blocked fleet membership excludes the rider, including riders in allowed fleets. */
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
  /** Open dispute ID, if one was raised */
  disputeId: string | null;
  /** Road-network routing snapshot used for pricing */
  routing: TaskRouting | null;
  /** Encoded route polyline */
  routePolyline: string | null;
  /** True when the rider must enter the customer's completion code at the final drop-off */
  completionCodeRequired: boolean;
  /** Digits in the completion code (4 or 6), or null when the task has none */
  completionCodeLength: 4 | 6 | null;
  /**
   * The completion code itself. Returned on create and get (never in list items), and never
   * sent to the rider. Null when the task was created without one.
   */
  completionCode?: TaskCompletionCode | null;
}

/**
 * Proof-of-delivery code for a task. Give `code` to your customer; the rider can only complete
 * the final drop-off by entering it.
 */
export interface TaskCompletionCode {
  /** The digits to share with your customer */
  code: string;
  length: 4 | 6;
  /** `CUSTOM` when you supplied the code, `GENERATED` when Relay generated it */
  source: 'CUSTOM' | 'GENERATED';
  /** `LOCKED` while entry is paused after five wrong attempts (for 15 minutes) */
  status: 'PENDING' | 'VERIFIED' | 'LOCKED';
  /** Wrong entries so far */
  failedAttempts: number;
  lockedUntil: ISOTimestamp | null;
  verifiedAt: ISOTimestamp | null;
}

/**
 * Ask for a completion code when creating a task: supply your own 4 or 6 digits, or let Relay
 * generate one (6 digits by default). Omit it and the task completes without a code.
 */
export type CompletionCodeRequest = { code: string } | { length?: 4 | 6 };

/**
 * Road-network routing snapshot captured when the task was priced
 */
export interface TaskRouting {
  provider: 'GOOGLE_ROUTES';
  pricingBasis: 'ROAD_NETWORK';
  generatedAt: ISOTimestamp;
  distanceMeters: number;
  durationSeconds: number;
  durationInTrafficSeconds: number;
  tollCostKobo: AmountInKobo;
  stagesCount: number;
  routePolyline: string | null;
}

/**
 * Task with rider details
 */
export type TaskWithRider = Task & { rider: RiderSnippet };

/**
 * @deprecated Create and get now return the full {@link Task}; kept as an alias.
 */
export type TaskRecord = Task;

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
  /**
   * Opt-in proof of delivery: the rider must enter this code to complete the final drop-off.
   * `{ code: '4821' }` uses your own code; `{ length: 4 }` or `{}` has Relay generate one.
   */
  completionCode?: CompletionCodeRequest;
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
  /** Estimated toll cost in kobo */
  tollFee?: AmountInKobo;
  /** Rate basis of the fixed fare; any allowed vehicle may be assigned. */
  pricingVehicleType?: VehicleType;
  /** Surge multiplier applied, when surge pricing is active */
  surgeMultiplier?: number;
  /** Whether surge pricing was applied */
  surgeActive?: boolean;
  /** Road distance and duration the price is based on */
  route?: {
    distanceKm: number;
    durationMinutes: number;
  };
  /** Further itemised fees (base, distance, time, insurance, …) in kobo */
  [fee: string]: unknown;
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
  /** How the task is being dispatched (live workflow or test simulation) */
  orchestration?: {
    type: string;
    status: string;
    note: string;
  };
}

/**
 * Request to get pricing quote
 */
export type TaskQuoteRequest = Pick<
  CreateTaskRequest,
  'taskType' | 'priority' | 'stages' | 'preferences'
>;

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
  completionCodeRequired?: boolean;
  completionCodeLength?: 4 | 6 | null;
}

/**
 * Response from list tasks request
 */
export interface ListTasksResponse {
  /** Array of task snippets */
  data: TaskListItem[];
  /** Whether there are more results */
  hasMore: boolean;
  /** Cursor for next page (null on the last page) */
  cursor: string | null;
}

/**
 * Response from get task request
 */
export interface GetTaskResponse {
  task: Task;
  /**
   * Your rating of this task's rider, or `null` if you haven't rated it. Each task can be rated
   * once, so check this before calling `relay.tasks.rate()`.
   */
  rating: TaskRating | null;
  /**
   * The rider's live ETA to their next stop, from the road route they are navigating and live
   * traffic. Null when no rider is on the way, or the rider's app hasn't reported one yet.
   */
  liveEta: TaskLiveEta | null;
}

/**
 * How far the rider is from the stop they are heading to
 */
export interface TaskLiveEta {
  /** Index of the stage the rider is heading to */
  stageIndex: number;
  /** Driving time left when the rider last reported, in seconds */
  seconds: number;
  /** Road distance left when the rider last reported, in metres */
  meters: number;
  /** When the rider is expected at the stop (ISO 8601) */
  arrivesAt: string;
  /** When the rider last reported this (ISO 8601) */
  updatedAt: string;
}

/**
 * Your rating of a completed task's rider
 */
export interface TaskRating {
  /** Rating (1-5) */
  rating: number;
  /** Your comment, if you left one */
  comment: string | null;
  /** When the rating was submitted (ISO 8601) */
  createdAt: string;
}

/**
 * Request to manually offer a task to specific riders (from `availableRiders`)
 */
export interface ManualAssignRequest {
  /** Riders to offer the task to; the first to accept is assigned (max 5) */
  riderIds: UUID[];
  /** How long riders have to accept, in seconds (15–300, default 60) */
  offerTimeoutSeconds?: number;
}

/**
 * Response from manual assign request
 */
export interface ManualAssignResponse {
  message: string;
  taskId: UUID;
  status: 'PENDING';
  workflowInstanceId: string;
  assignment: {
    offerId: string;
    submittedRiderIds: UUID[];
    acceptedRiderIds: UUID[];
    rejectedRiders: { riderId: UUID; reason: string }[];
    requestedRiderCount: number;
    acceptedRiderCount: number;
    maxRiders: number;
    truncated: boolean;
    offerTimeoutSeconds: number;
  };
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
 * A rider you may offer a manual task to. Coordinates, photo and plate number are not shared
 * until the rider is assigned; then they appear on the task.
 */
export interface AvailableRider {
  /** Rider ID, accepted by `tasks.assign` */
  riderId: UUID;
  /** Rider first name */
  firstName: string;
  /** Straight-line distance to the pickup, rounded to 0.1 km */
  distanceKm: number;
  /** Vehicle type and capabilities */
  vehicle: {
    type: VehicleType | null;
    hasRefrigeration: boolean | null;
    hasBox: boolean | null;
    hasAirConditioning: boolean | null;
  } | null;
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
export interface AvailableRidersResponse {
  taskId: UUID;
  tier: number;
  /** How many riders a single `assign` call may include */
  maxAssignableRiders: number;
  /** Nearest eligible riders first, at most 20 */
  riders: AvailableRider[];
}
