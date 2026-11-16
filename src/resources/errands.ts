/**
 * Errands: the price list and limits in force for your account.
 *
 * @module resources/errands
 */

import type { ErrandOptions } from '../types';
import type { HttpClient } from '../utils/http';

export class Errands {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fees per work stage, free minutes, the on-site rate, handling on money SendRelay pays a shop,
   * the limits, and whether errands with work stages and shop payments are on for you. The same
   * numbers the quote uses; cached for a minute.
   *
   * @example
   * ```typescript
   * const options = await relay.errands.options();
   * if (!options.payWith.merchantTransfer.enabled) console.log('Book PURCHASE stops as PREPAID');
   * ```
   */
  async options(): Promise<ErrandOptions> {
    return this.http.get<ErrandOptions>('/sdk/errands/options');
  }
}
