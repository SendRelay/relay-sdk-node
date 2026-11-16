/**
 * Task-related types
 *
 * @module types/task
 */

import type { AmountInKobo, ISOTimestamp, Location, UUID } from './common';
import type {
  Approval,
  ApprovalsPolicy,
  ErrandPricing,
  ErrandQuestion,
  ErrandQuotePricing,
  ErrandSummary,
  ErrandWarning,
  PurchaseItem,
  StageFailureReason,
  StageResult,
  StageSkipReason,
  TaskSchedule,
  WorkStageFields,
  WorkStageType,
} from './errand';

/**
 * Type of delivery task
 */
export type TaskType =
  | 'PASSENGER_RIDE'
  | 'FOOD_DELIVERY'
  | 'PACKAGE_DELIVERY'
  /**
   * A cheaper delivery that goes out in a wave on set days of the week, shared with other deliveries going the same
   * way. Needs `window`; one PICKUP and one DROPOFF; no `dispatch`.
   */
  | 'POOLED_DELIVERY'
  /** @deprecated Renamed POOLED_DELIVERY; create and quote refuse it (TASK_TYPE_RENAMED). Older tasks keep it. */
  | 'BULK_DELIVERY'
  | 'ERRAND';

/** A pooled delivery wave. SendRelay may add waves; an unknown one arrives as its raw string. */
export type PooledWave = 'MIDDAY' | (string & {});

/**
 * `window` on create and quote, POOLED_DELIVERY only. Leave `date` (YYYY-MM-DD, Lagos) out for the
 * next wave still open. Quote without a window to see the upcoming waves and their prices.
 */
export interface PooledWindowRequest {
  wave: PooledWave;
  date?: string;
}

/** Where a pooled delivery stands: waiting for the wave, on a shared route, or going alone. */
export type PooledState = 'WAITING' | 'GROUPED' | 'SOLO' | (string & {});

/** A pooled delivery's `window` on the task */
export interface TaskPooledWindow {
  wave: PooledWave;
  date: string;
  /** Last moment to book (and cancel for free) into this wave */
  bookBy: ISOTimestamp;
  pickupFrom: ISOTimestamp;
  pickupTo: ISOTimestamp;
  deliverBy: ISOTimestamp;
  state: PooledState;
  /** How many other deliveries share its route (never who they are) */
  sharedWith: number | null;
  plannedPickupAt: ISOTimestamp | null;
  plannedDeliveryAt: ISOTimestamp | null;
  /** Stops the rider makes before this delivery's next stop, while that is known */
  stopsBefore?: number | null;
}

/** An upcoming wave in a pooled quote, with this delivery's price range in it */
export interface PooledQuoteWindow {
  wave: PooledWave;
  date: string;
  /** FULL waves refuse bookings with WAVE_FULL */
  status: 'OPEN' | 'FULL' | (string & {});
  bookBy: ISOTimestamp;
  pickupFrom: ISOTimestamp;
  pickupTo: ISOTimestamp;
  deliverBy: ISOTimestamp;
  pricing: {
    kind: 'RANGE';
    /** The most you pay: held at booking */
    maxTotal: AmountInKobo;
    /** The expected price, from deliveries already booked nearby */
    total: AmountInKobo;
    /** The least you pay */
    minTotal: AmountInKobo;
  };
  /** Pass to create with this window to lock the price range */
  quoteId: string;
  expiresAt: ISOTimestamp;
}

/**
 * Task lifecycle status
 */
export type TaskStatus =
  /** Booked for a pickup time (dispatch SCHEDULED); SendRelay has not started looking yet */
  | 'SCHEDULED'
  | 'PENDING'
  /** Still looking for a rider after the first offers (dispatch WAIT_FOR_RIDER or SCHEDULED) */
  | 'SEARCHING'
  | 'OFFERED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'PAYMENT_FAILED'
  // SendRelay adds statuses over time; one this version does not list arrives as its raw string.
  // Handle the ones you know and treat any other as "still in progress".
  | (string & {});

/**
 * When SendRelay looks for a rider. SendRelay may add strategies; an unknown one arrives as its raw string.
 */
export type DispatchStrategy = 'IMMEDIATE' | 'WAIT_FOR_RIDER' | 'SCHEDULED' | (string & {});

/**
 * `dispatch` on create and quote. Leave it out for today's behaviour (IMMEDIATE). It is part of
 * the quote lock: create must send the same `dispatch` as the quote.
 */
export type DispatchRequest =
  /** Offer to nearby riders now; fail with NO_RIDERS_AVAILABLE if nobody accepts (about two minutes) */
  | ({ strategy: 'IMMEDIATE'; readyAt?: ISOTimestamp } & DispatchOptions)
  /** As IMMEDIATE, then keep offering as riders come online nearby, up to `maxWaitMinutes` (5–720; food 5–45) */
  | ({ strategy: 'WAIT_FOR_RIDER'; maxWaitMinutes: number; readyAt?: ISOTimestamp } & DispatchOptions)
  /**
   * Book for a pickup time 45 minutes to 7 days ahead, priced for that time and held now. SendRelay
   * starts looking about 20 minutes before `pickupAt` (ISO 8601 with a UTC offset) and keeps
   * looking until `pickupWindowMinutes` after it (default 30, at most 120).
   */
  | ({ strategy: 'SCHEDULED'; pickupAt: ISOTimestamp; pickupWindowMinutes?: number } & DispatchOptions);

/**
 * Options on every strategy. `readyAt` (IMMEDIATE and WAIT_FOR_RIDER, at most 45 minutes ahead):
 * when the pickup will be ready; the search opens in time to arrive then, and the task waits as
 * SCHEDULED until it does.
 */
export interface DispatchOptions {
  /**
   * What happens if the rider cancels before pickup. `CANCEL` (default): the task ends CANCELLED
   * and is refunded. `FIND_ANOTHER`: SendRelay looks again (at most twice) and fires
   * `task.dispatch.rider_unassigned`; the task goes back to PENDING. Needs autoAssign.
   */
  onRiderCancel?: 'CANCEL' | 'FIND_ANOTHER';
}

/**
 * The dispatch block on every task: the strategy and its search window
 */
export interface TaskDispatch {
  strategy: DispatchStrategy;
  maxWaitMinutes: number | null;
  pickupAt: ISOTimestamp | null;
  pickupWindowMinutes: number | null;
  /** When SendRelay started (or starts) looking for a rider */
  searchStartsAt: ISOTimestamp;
  /** When SendRelay stops looking; null for IMMEDIATE (the offer waves decide) */
  searchExpiresAt: ISOTimestamp | null;
  /** Offer rounds sent after the first waves, while the task kept searching */
  offerRounds: number;
  /** When the pickup will be ready, if given */
  readyAt?: ISOTimestamp | null;
  /** CANCEL (default) or FIND_ANOTHER when the rider cancels before pickup */
  onRiderCancel?: 'CANCEL' | 'FIND_ANOTHER';
}

/**
 * Task priority level
 */
export type Priority = 'STANDARD' | 'URGENT';

/**
 * Stage type in a task. The five work types are for `ERRAND` only (see `WorkStageType`).
 */
export type StageType = 'PICKUP' | 'DROPOFF' | WorkStageType;

/**
 * Stage status. FAILED and SKIPPED appear only on errands with work stages; the rider goes on.
 */
export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

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
export type VehicleType = 'BICYCLE' | 'MOTORCYCLE' | 'TRICYCLE' | 'CAR' | 'VAN' | 'TRUCK';

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
  /** Your own id for this parcel, so the same parcel can be followed across legs later */
  reference?: string;
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
 * Task stage: a pickup, a drop-off, or on an errand a job at a place (`WorkStageFields`)
 */
export interface Stage extends Omit<WorkStageFields, 'items'> {
  /** Stage type */
  type: StageType;
  /** Location */
  location: Location;
  /** Special instructions for the rider */
  instructions: string;
  /** Items in this stage (cargo tasks), or a PURCHASE's shopping list */
  items?: Item[] | PurchaseItem[];
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
  /** Who to call at this stop. Shown only to the assigned rider, and returned to you */
  contact?: StageContact | null;
  /** DROPOFF only: `items[].reference` values from earlier pickups to hand over here */
  deliverItems?: string[];
  /**
   * Request: a code the rider must enter to finish this stop (`{ code }` or `{ length }`). Response:
   * on create and get, this stop's code. Never sent to the rider.
   */
  completionCode?: CompletionCodeRequest | TaskCompletionCode | null;
  /** Response: digits of this stop's code, when it has one */
  completionCodeLength?: 4 | 6;
  /** Response: when the rider reached this stop (inside its geofence); null if not detected */
  arrivedAt?: ISOTimestamp | null;
  /** Response: seconds from arrivedAt to completedAt (information only) */
  waitSeconds?: number | null;
  /** Response, errands: when the rider is expected here, as quoted */
  plannedArrivalAt?: ISOTimestamp;
  /** Response, errand work stages: what came back */
  result?: StageResult | null;
  /** Response, errand work stages: why it was not done or was skipped */
  reason?: StageFailureReason | StageSkipReason | null;
  /** Response, errand work stages: the open question here, else the latest */
  approval?: Approval | null;
}

/** Who to call at a stop */
export interface StageContact {
  name?: string | null;
  phone: string;
}

/**
 * Task preferences (rider requirements)
 */
export interface Preferences {
  /** Minimum rider rating (1-5) */
  minRating?: number;
  /**
   * `true` asks every vehicle for a delivery box and `false` asks none. Left out, SendRelay decides from
   * the task type and load (see `requirements`). Does not guarantee insulation.
   */
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

/** Equipment on a rider's vehicle. Treat a value you don't recognise as equipment you can't check. */
export type RiderEquipment = 'BOX' | 'REFRIGERATION' | 'AIR_CONDITIONING' | (string & {});

/**
 * What SendRelay looks for in a rider: each vehicle that can take the task, with the equipment a rider
 * on it needs (for example a box on a motorcycle for food). Every vehicle is listed when the task
 * names none.
 */
export interface TaskRequirements {
  vehicles: Array<{ vehicleType: VehicleType; equipment: RiderEquipment[] }>;
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
  /** Parsed pricing object. On an errand with work stages, an `ErrandPricing` range */
  pricing: (Record<string, unknown> & Partial<ErrandPricing>) | null;
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
   * Goes up with every event about this task and matches the `revision` those events carry.
   * Store it, and apply a webhook only if its `data.revision` is higher. 0 before the first event.
   */
  revision: number;
  /** Currency of every amount on the task, in minor units (kobo for NGN). */
  currency: 'NGN';
  /** A completion photo is required at every DROPOFF */
  requirePhoto?: boolean;
  /**
   * The completion code itself. Returned on create and get (never in list items), and never
   * sent to the rider. Null when the task was created without one.
   */
  completionCode?: TaskCompletionCode | null;
  /** When SendRelay looks for a rider, and for how long */
  dispatch: TaskDispatch;
  /** The vehicles SendRelay looks for and the equipment a rider on each needs */
  requirements?: TaskRequirements;
  /** POOLED_DELIVERY only: its wave and where it stands */
  window?: TaskPooledWindow;
  /** ERRAND with work stages: how far it got (`outcome` is set when it ends) */
  errand?: ErrandSummary;
  /** ERRAND with work stages: how long the rider waits for your answer, and what happens then */
  approvals?: Required<ApprovalsPolicy>;
  /** "Never charge me more than this", in kobo, when you set one */
  priceLimit?: AmountInKobo;
}

/**
 * Proof-of-delivery code for a task. Give `code` to your customer; the rider can only complete
 * the final drop-off by entering it.
 */
export interface TaskCompletionCode {
  /** The digits to share with your customer */
  code: string;
  length: 4 | 6;
  /** `CUSTOM` when you supplied the code, `GENERATED` when SendRelay generated it */
  source: 'CUSTOM' | 'GENERATED';
  /** `LOCKED` while entry is paused after five wrong attempts (for 15 minutes) */
  status: 'PENDING' | 'VERIFIED' | 'LOCKED';
  /** Wrong entries so far */
  failedAttempts: number;
  lockedUntil: ISOTimestamp | null;
  verifiedAt: ISOTimestamp | null;
}

/**
 * Ask for a completion code when creating a task: supply your own 4 or 6 digits, or let SendRelay
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
   * `{ code: '4821' }` uses your own code; `{ length: 4 }` or `{}` has SendRelay generate one.
   */
  completionCode?: CompletionCodeRequest;
  /** When SendRelay looks for a rider (default: IMMEDIATE). Not on POOLED_DELIVERY */
  dispatch?: DispatchRequest;
  /** POOLED_DELIVERY only, and required there: the wave to book into */
  window?: PooledWindowRequest;
  /** A completion photo at every DROPOFF (default: false) */
  requirePhoto?: boolean;
  /** "Never charge me more than this", in kobo: a quote whose maximum is above it is refused */
  priceLimit?: AmountInKobo;
  /** ERRAND with work stages: how long the rider waits for your answer (default 300 s, DECLINE) */
  approvals?: ApprovalsPolicy;
  /**
   * Insurance on the items' declared values. On by default; `false` turns it off for this task, so
   * no premium is charged and loss or damage is not covered. Send the same value you quoted.
   */
  insured?: boolean;
  /**
   * Test-mode simulation outcome. SEARCH_THEN_ASSIGNED and SEARCH_EXPIRED need WAIT_FOR_RIDER or
   * SCHEDULED; NO_RIDERS needs IMMEDIATE.
   */
  simulationOutcome?:
    | 'SUCCESS'
    | 'NO_RIDERS'
    | 'TIER_1_TIMEOUT'
    | 'TIER_2_TIMEOUT'
    | 'TIER_3_TIMEOUT'
    | 'RANDOM'
    | 'CANCEL_BEFORE_ACCEPT'
    | 'CANCEL_AFTER_ACCEPT'
    | 'SEARCH_THEN_ASSIGNED'
    | 'SEARCH_EXPIRED'
    /** dispatch.onRiderCancel FIND_ANOTHER only: the first rider cancels, a second completes */
    | 'RIDER_CANCELS_THEN_REASSIGNED'
    /** POOLED_DELIVERY only: no route suits it, so it goes alone at its maximum price */
    | 'POOLING_SOLO';
}

/** `relay.tasks.update`: details you can change after create. Anything else is FIELD_NOT_EDITABLE */
export interface UpdateTaskRequest {
  notes?: string | null;
  externalId?: string | null;
  /**
   * Per stop, until that stop is completed. `contact: null` removes it. On an errand, until the
   * rider gets there: `items` replaces a PURCHASE list and `questions` an INSPECTION checklist
   */
  stages?: Array<{
    index: number;
    instructions?: string;
    contact?: StageContact | null;
    items?: PurchaseItem[];
    questions?: ErrandQuestion[];
  }>;
}

/** `relay.tasks.trackingLink` */
export interface TrackingLinkRequest {
  /** Limit the link to one DROPOFF: that recipient sees only their own stop */
  stageIndex?: number;
  /** Errands: the person with the link may answer the open questions that fit inside the held maximum */
  canAnswer?: boolean;
}

/** A hosted tracking page to send your customer. SendRelay never contacts them itself */
export interface TrackingLinkResponse {
  url: string;
  expiresAt: ISOTimestamp;
  stageIndex: number | null;
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
  /** Insurance premium in kobo; 0 when the task is not insured. Included in `subtotal` and `total`. */
  insuranceFee?: AmountInKobo;
  /** Declared value the premium covers, in kobo */
  insuredValue?: AmountInKobo;
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
  /** POOLED_DELIVERY: `RANGE`, the price is set when the rider starts the route */
  kind?: 'RANGE';
  /** POOLED_DELIVERY: the most you pay (held at booking) */
  maxTotal?: AmountInKobo;
  /** POOLED_DELIVERY: the least you pay */
  minTotal?: AmountInKobo;
  /** POOLED_DELIVERY: the final price, once set; null before */
  finalTotal?: AmountInKobo | null;
  /** POOLED_DELIVERY: when the final price was set */
  finalAt?: ISOTimestamp | null;
  /** Further itemised fees (base, distance, time, …) in kobo */
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
  /** ERRAND with work stages: the range held (`pricing.total` is its maximum) */
  errand?: ErrandQuotePricing;
  /** ERRAND with work stages, or SCHEDULED: when the rider is expected at each stop */
  schedule?: TaskSchedule;
  /** Things worth a look; never blocking */
  warnings?: ErrandWarning[];
  approvals?: Required<ApprovalsPolicy>;
}

/**
 * Request to get pricing quote
 */
export type TaskQuoteRequest = Pick<
  CreateTaskRequest,
  'taskType' | 'priority' | 'stages' | 'preferences' | 'dispatch' | 'insured' | 'window' | 'priceLimit' | 'approvals'
>;

/**
 * Response from simulateAdvance (test keys): the booking's search opens now
 */
export interface SimulateAdvanceResponse {
  message: string;
  taskId: UUID;
  /** Still SCHEDULED in the response; it moves to PENDING within seconds */
  status: TaskStatus;
  searchStartsAt: ISOTimestamp;
  searchExpiresAt: ISOTimestamp;
}

/**
 * Response from pricing quote request
 */
export type TaskQuoteResponse = PricingBreakdown & {
  task: TaskQuoteRequest;
  quoteId: string;
  expiresAt: string;
  quoteTtlSeconds: number;
  /** What the task will need, as create will store it */
  requirements?: TaskRequirements;
  /**
   * POOLED_DELIVERY: the upcoming waves (the one named in `window`, or all of them), each with its
   * own price range and `quoteId`
   */
  windows?: PooledQuoteWindow[];
  /** ERRAND with work stages: the range (`total` above is its maximum, the amount held) */
  pricing?: ErrandQuotePricing;
  /** ERRAND with work stages, or SCHEDULED: when the rider is expected at each stop */
  schedule?: TaskSchedule;
  /** Things worth a look before you pay; never blocking */
  warnings?: ErrandWarning[];
  /** ERRAND with work stages: each stage with every default written out */
  stages?: Stage[];
  approvals?: Required<ApprovalsPolicy>;
};

/**
 * Request to list tasks
 */
export interface ListTasksRequest {
  /** Maximum number of results (max: 30) */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
  /** Sort order: by creation time, or by update time when `updatedSince` is set */
  order?: 'asc' | 'desc';
  /**
   * Only tasks changed at or after this ISO 8601 time, ordered by `updatedAt`. For reconciliation
   * jobs: walk forward with `order: 'asc'` and keep the latest `updatedAt` you saw.
   */
  updatedSince?: string;
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
  /** Same as `Task.revision` */
  revision?: number;
  /** Same as `Task.currency` */
  currency?: 'NGN';
  /** Last update timestamp */
  updatedAt?: ISOTimestamp;
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
  /** SEARCHING for a manual task that keeps looking */
  status: 'PENDING' | 'SEARCHING';
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
