/**
 * Builders for errand stages. Each returns the same plain stage object you could write by hand;
 * they only save remembering which fields each type takes.
 *
 * @example
 * ```typescript
 * import { Errand } from '@relay-sdk/sdk-node';
 *
 * await relay.tasks.create({
 *   taskType: 'ERRAND',
 *   stages: [
 *     Errand.queue(bank, { instructions: 'Collect the hardware token for account ending 4421', expectedMinutes: 30, maxMinutes: 90 }),
 *     Errand.purchase(shoprite, [{ name: 'Peak milk 400g', quantity: 2, maxUnitPrice: 350_000 }], { spendLimit: 2_500_000 }),
 *     Errand.dropoff(home, { contact: { name: 'Ada', phone: '+2348030000000' } }),
 *   ],
 * });
 * ```
 *
 * @module errand
 */

import type { Location } from './types/common';
import type { CustomEffort, ErrandQuestion, PurchaseItem, WorkStageFields } from './types/errand';
import type { Item, Stage, StageContact } from './types/task';

/** What every builder takes besides its required fields. */
export type ErrandStageOptions = Omit<WorkStageFields, 'items' | 'questions' | 'payee' | 'amount' | 'effort'> & {
  instructions?: string;
  contact?: StageContact;
  /** DROPOFF: the item or PURCHASE references to hand over here */
  deliverItems?: string[];
};

const stage = (type: Stage['type'], location: Location, options: ErrandStageOptions = {}, extra: Partial<Stage> = {}): Stage => {
  const { instructions, ...rest } = options;
  return { type, location, instructions: instructions ?? '', ...rest, ...extra } as Stage;
};

export const Errand = {
  /** Collect items to carry, as on any delivery. */
  pickup: (location: Location, items: Item[], options?: ErrandStageOptions): Stage => stage('PICKUP', location, options, { items }),
  /** Hand over what was collected or bought. Left without `deliverItems`, everything comes here. */
  dropoff: (location: Location, options?: ErrandStageOptions): Stage => stage('DROPOFF', location, options),
  /** Wait in line or for a service, then report back. */
  queue: (location: Location, options?: ErrandStageOptions): Stage => stage('QUEUE', location, options),
  /** Buy a shopping list, within the prices you set. */
  purchase: (location: Location, items: PurchaseItem[], options?: ErrandStageOptions): Stage =>
    stage('PURCHASE', location, options, { items }),
  /** Pay a bill or a fee and bring the receipt. `amount` is the bill you expect, in kobo. */
  payment: (location: Location, payee: string, amount: number, options?: ErrandStageOptions): Stage =>
    stage('PAYMENT', location, options, { payee, amount }),
  /** Look at something and answer your questions. */
  inspection: (location: Location, questions: ErrandQuestion[], options?: ErrandStageOptions): Stage =>
    stage('INSPECTION', location, options, { questions }),
  /** Anything else, described in `instructions`. `effort` sets the stage fee. */
  custom: (
    location: Location,
    instructions: string,
    effort: CustomEffort,
    options?: Omit<ErrandStageOptions, 'instructions'> & { questions?: ErrandQuestion[] },
  ): Stage => {
    const { questions, ...rest } = options ?? {};
    return stage('CUSTOM', location, { ...rest, instructions }, { effort, ...(questions ? { questions } : {}) });
  },
} as const;
