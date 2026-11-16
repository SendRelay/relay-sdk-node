/**
 * Errands: a rider queues, buys, pays a bill, checks something or does a task you describe, at
 * one or more stops (`taskType: 'ERRAND'`). Each job is one stage in `stages`. See
 * https://docs.sendrelay.com.ng/errands
 *
 * @module types/errand
 */

import type { AmountInKobo, ISOTimestamp, UUID } from './common';

/** The five work stage types. PICKUP and DROPOFF keep working on an errand. */
export type WorkStageType = 'PURCHASE' | 'PAYMENT' | 'QUEUE' | 'INSPECTION' | 'CUSTOM';

/** What the rider does when an item is not there. */
export type IfUnavailable = 'SKIP' | 'SIMILAR' | 'ASK';

/** `MERCHANT_TRANSFER`: SendRelay pays the shop from your held funds. `PREPAID`: you already paid. */
export type PayWith = 'MERCHANT_TRANSFER' | 'PREPAID';

/** How much work a CUSTOM stage is; it sets the stage fee. */
export type CustomEffort = 'S' | 'M' | 'L';

export type QuestionType = 'YES_NO' | 'TEXT' | 'NUMBER' | 'PHOTO' | 'CHOICE';

/** Why a stage did not get done. */
export type StageFailureReason = 'OUT_OF_STOCK' | 'CLOSED' | 'REFUSED' | 'NOT_READY' | 'PAYMENT_FAILED' | 'OTHER' | (string & {});

/** Why a stage was skipped. */
export type StageSkipReason = 'SKIPPED_BY_YOU' | 'NOTHING_TO_DELIVER' | 'DECLINED' | 'TASK_ENDED' | (string & {});

/** One line of a PURCHASE's shopping list. Prices in kobo. */
export interface PurchaseItem {
  name: string;
  /** Default 1 */
  quantity?: number;
  unit?: string;
  /** The most you pay for one; above it the rider asks you */
  maxUnitPrice?: AmountInKobo;
  note?: string;
  /** Overrides the stage's `ifUnavailable` for this line */
  ifUnavailable?: IfUnavailable;
}

/** A question the rider answers at the stop. */
export interface ErrandQuestion {
  /** Your id for the answer; SendRelay numbers them when left out */
  id?: string;
  type: QuestionType;
  text: string;
  /** CHOICE only: 2 to 10 options */
  options?: string[];
  /** Default true */
  required?: boolean;
}

/** The shop's account, if you know it: the account the rider pays must match it exactly. */
export interface MerchantAccount {
  bankCode: string;
  accountNumber: string;
}

/** Test keys only: what the simulated rider does at this stage. */
export interface StageSimulate {
  outcome: 'COMPLETE' | 'FAIL' | 'ASK' | 'OVERRUN';
  reason?: StageFailureReason;
  kind?: ApprovalKind;
  spend?: AmountInKobo;
  minutes?: number;
}

/**
 * When the place is open, in Lagos time: one window a day on the listed days (every day when
 * `days` is left out). The quote warns when a stop is planned too close to closing.
 */
export interface OpeningHours {
  days?: Array<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'>;
  /** 24-hour HH:MM, for example "08:30" */
  opens: string;
  closes: string;
}

/**
 * Fields a work stage takes on top of a stage's `type`, `location`, `instructions`, `contact`
 * and `reference`. A PICKUP or DROPOFF may also set `expectedMinutes`/`maxMinutes` (a paid wait).
 */
export interface WorkStageFields {
  /** Your name for the stage, unique in the task. What a PURCHASE buys is carried under it */
  reference?: string;
  /** Minutes the rider is expected to spend there (defaults by type, see `errands.options()`) */
  expectedMinutes?: number;
  /** The most time on site that is paid for, up to 240 */
  maxMinutes?: number;
  openingHours?: OpeningHours;
  /** PURCHASE */
  items?: PurchaseItem[];
  /** PURCHASE, default SKIP */
  ifUnavailable?: IfUnavailable;
  /** PURCHASE and PAYMENT: the most the rider may spend here, in kobo */
  spendLimit?: AmountInKobo;
  /** PURCHASE and PAYMENT, default MERCHANT_TRANSFER */
  payWith?: PayWith;
  merchant?: MerchantAccount;
  /** PAYMENT: who is paid */
  payee?: string;
  /** PAYMENT: the bill you expect, in kobo */
  amount?: AmountInKobo;
  /** PAYMENT: a bill or account number */
  billReference?: string;
  /** INSPECTION (required) and CUSTOM (optional) */
  questions?: ErrandQuestion[];
  /** CUSTOM, required */
  effort?: CustomEffort;
  /** Test keys only */
  simulate?: StageSimulate;
}

/** How long the rider waits for your answer (60 to 1,800 s) and what happens if nobody answers. */
export interface ApprovalsPolicy {
  waitSeconds?: number;
  /** DECLINE, or APPROVE (only a request that fits inside the held maximum) */
  ifNoAnswer?: 'DECLINE' | 'APPROVE';
}

/** One line of the shopping list as the rider found it, in list order. */
export interface PurchaseItemResult {
  name: string;
  quantity: number;
  status: 'BOUGHT' | 'SWAPPED' | 'MISSING' | (string & {});
  unitPrice: AmountInKobo | null;
  total: AmountInKobo | null;
  substitute?: string;
}

/** What came back from a work stage. Files open with `tasks.viewFile()`. */
export interface StageResult {
  minutes: number;
  paidMinutes: number;
  photos: string[];
  note: string | null;
  receipt?: string | null;
  items?: PurchaseItemResult[];
  spend?: AmountInKobo;
  answers?: Array<{ id: string; value: string | number | boolean }>;
}

export type ApprovalKind = 'SUBSTITUTE' | 'PRICE_ABOVE_MAX' | 'OVER_SPEND_LIMIT' | 'MORE_TIME' | 'QUESTION' | (string & {});
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | (string & {});

/** A question from the rider. Answer it with `tasks.decideApproval()`. */
export interface Approval {
  id: string;
  taskId: UUID;
  stageIndex: number;
  stageReference: string | null;
  kind: ApprovalKind;
  status: ApprovalStatus;
  /** The question in plain words, as the rider app shows it */
  question: string;
  /** What the rider proposes (the swap, the price, the minutes) */
  proposal: Record<string, unknown>;
  photo: string | null;
  /** What approving does to the price */
  effect: { raisesMaximum: boolean; spendChange: AmountInKobo; maxTotalAfter: AmountInKobo };
  expiresAt: ISOTimestamp;
  ifNoAnswer: 'DECLINE' | 'APPROVE';
  /** `api`, `timeout`, `rider`, `staff`, `user:<id>` or `link:<id>` */
  decidedBy: string | null;
  decidedAt: ISOTimestamp | null;
  note: string | null;
  createdAt: ISOTimestamp;
}

/** `tasks.decideApproval` */
export interface ApprovalDecisionRequest {
  decision: 'APPROVE' | 'DECLINE';
  /** Shown to the rider */
  note?: string;
}

/** `tasks.approvals` */
export interface ListApprovalsResponse {
  approvals: Approval[];
}

/** How far an errand got: set when it ends. */
export interface ErrandSummary {
  outcome: 'DONE' | 'PARTLY_DONE' | 'NOT_DONE' | null;
  completed: number;
  failed: number;
  skipped: number;
}

/** One line of an errand bill. */
export interface ErrandBillLine {
  label: string;
  amount: AmountInKobo;
  stageIndex?: number;
  fee?: AmountInKobo;
  minutes?: number;
  paidMinutes?: number;
  time?: AmountInKobo;
  handling?: AmountInKobo;
}

/** The quote of an errand with work stages: a range, split into service and goods. */
export interface ErrandQuotePricing {
  kind: 'RANGE';
  /** Expected */
  total: AmountInKobo;
  /** The most it can cost, held at create */
  maxTotal: AmountInKobo;
  /** The least it can cost */
  minTotal: AmountInKobo;
  service: { expected: AmountInKobo; max: AmountInKobo };
  spend: { expected: AmountInKobo; max: AmountInKobo };
  lines: ErrandBillLine[];
}

/** The final bill, once the errand ends. `refund` is the part of the held maximum it did not use. */
export interface ErrandFinalBill {
  total: AmountInKobo;
  service: AmountInKobo;
  spend: AmountInKobo;
  refund: AmountInKobo;
  lines: ErrandBillLine[];
}

/** An errand task's `pricing` while it runs and after. */
export interface ErrandPricing {
  kind: 'RANGE';
  total: AmountInKobo;
  maxTotal: AmountInKobo;
  minTotal: AmountInKobo;
  service: { expected: AmountInKobo; max: AmountInKobo };
  spend: { expected: AmountInKobo; max: AmountInKobo };
  /** What it would cost if it ended now */
  soFar: { total: AmountInKobo; service: AmountInKobo; spend: AmountInKobo };
  finalTotal: AmountInKobo | null;
  finalAt: ISOTimestamp | null;
  final: ErrandFinalBill | null;
}

/** When the rider is expected at each stop, if a rider reaches the first one at `startsAt`. */
export interface TaskSchedule {
  startsAt: ISOTimestamp;
  finishesAt: ISOTimestamp;
  stages: Array<{
    index: number;
    arrivesAt: ISOTimestamp;
    leavesAt: ISOTimestamp;
    closesAt?: ISOTimestamp;
    slackMinutes?: number;
  }>;
}

export type ErrandWarningCode =
  | 'TIGHT_OPENING_HOURS'
  | 'TIGHT_DELIVER_BY'
  | 'SPEND_LIMIT_BELOW_LIST'
  | 'NO_APPROVAL_LISTENER'
  | 'LONG_WAIT_HOLD'
  | (string & {});

/** Something worth a look before you pay. Warnings never block. */
export interface ErrandWarning {
  code: ErrandWarningCode;
  stageIndex?: number;
  message: string;
}

/** `errands.options()`: the price list and limits in force for your account. */
export interface ErrandOptions {
  /** False until errands with work stages are switched on for you */
  available: boolean;
  currency: 'NGN';
  stageTypes: Array<{
    type: WorkStageType | 'PICKUP' | 'DROPOFF' | (string & {});
    fee: AmountInKobo | { S: AmountInKobo; M: AmountInKobo; L: AmountInKobo };
    freeMinutes: number;
    expectedMinutes: number;
    maxMinutes: number;
    includedLines?: number;
    perExtraLineFee?: AmountInKobo;
  }>;
  paidWait: { appliesTo: ['PICKUP', 'DROPOFF']; freeMinutes: number; expectedMinutes: number };
  onSitePerMinute: AmountInKobo;
  handling: { percentBps: number; min: AmountInKobo; max: AmountInKobo; appliesTo: 'MERCHANT_TRANSFER' };
  payWith: {
    available: PayWith[];
    merchantTransfer: { enabled: boolean; paused: boolean };
  };
  limits: {
    maxStages: number;
    maxWorkStages: number;
    maxStageMinutes: number;
    maxItems: number;
    maxQuestions: number;
    maxSpendPerTask: AmountInKobo;
  };
  approvals: { waitSeconds: number; ifNoAnswer: 'DECLINE' | 'APPROVE'; minWaitSeconds: number; maxWaitSeconds: number };
}

/** `tasks.viewFile`: a link to a photo or receipt, valid for 15 minutes. */
export interface FileViewResponse {
  downloadUrl: string;
  expiresAt: ISOTimestamp;
}
