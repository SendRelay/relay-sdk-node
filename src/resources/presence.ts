/**
 * Presence resource: anonymous rider availability for maps
 *
 * @module resources/presence
 */

import type { PresenceRequest, PresenceResponse } from '../types';
import type { HttpClient } from '../utils/http';

/**
 * Where available riders are around a point, for showing supply on a map before you create a
 * task. Riders are never identified: positions are grouped into cells no finer than a city
 * block, counts are banded, and a lone rider is merged into a larger cell.
 *
 * Live keys see the live fleet (cached for `refreshAfterSeconds`); test keys see simulated
 * riders so you can build the map before going live.
 */
export class Presence {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get the presence map around a point.
   *
   * @example
   * ```typescript
   * const presence = await relay.presence.get({
   *   latitude: 6.5244,
   *   longitude: 3.3792,
   *   resolution: 'BLOCK',
   * });
   *
   * for (const cell of presence.cells) {
   *   drawPolygon(cell.boundary, { density: cell.density, vehicles: cell.vehicleTypes });
   * }
   * console.log(`${presence.totals.byVehicleType.MOTORCYCLE} motorcycles nearby`);
   * ```
   */
  async get(request: PresenceRequest): Promise<PresenceResponse> {
    return this.http.get<PresenceResponse>('/sdk/presence', { params: request });
  }
}
