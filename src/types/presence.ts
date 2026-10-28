/**
 * Rider presence map types
 *
 * @module types/presence
 */

import type { ISOTimestamp } from './common';
import type { VehicleType } from './task';

/**
 * How finely presence is grouped. Nothing finer than a city block is ever returned.
 *
 * - `BLOCK` (default): H3 resolution 9, cells ≈ 0.1 km² — a city block
 * - `NEIGHBOURHOOD`: H3 resolution 8, cells ≈ 0.74 km²
 * - `DISTRICT`: H3 resolution 7, cells ≈ 5.2 km²
 */
export type PresenceResolution = 'BLOCK' | 'NEIGHBOURHOOD' | 'DISTRICT';

/** Banded riders per cell: `LOW` 1–2, `MEDIUM` 3–5, `HIGH` 6 or more */
export type PresenceDensity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PresencePoint {
  latitude: number;
  longitude: number;
}

/** One map cell with available riders */
export interface PresenceCell {
  /** H3 cell index */
  cellId: string;
  /**
   * Usually the requested resolution; coarser where too few riders were present to show finer
   * cells without singling a rider out.
   */
  resolution: PresenceResolution;
  h3Resolution: number;
  center: PresencePoint;
  /** Closed polygon outline (first point repeated last) */
  boundary: PresencePoint[];
  density: PresenceDensity;
  /** Vehicle types with at least one available rider in the cell */
  vehicleTypes: VehicleType[];
}

/** Request for a presence map around a point */
export interface PresenceRequest {
  latitude: number;
  longitude: number;
  /** Defaults to `BLOCK` */
  resolution?: PresenceResolution;
}

/** Anonymous presence of available riders around a point */
export interface PresenceResponse {
  /** Test keys receive simulated riders */
  mode: 'live' | 'test';
  simulated: boolean;
  resolution: PresenceResolution;
  h3Resolution: number;
  /** Covered area; its centre is snapped to a fixed grid near the requested point */
  area: { center: PresencePoint; radiusKm: number };
  cells: PresenceCell[];
  totals: {
    /** Available (online, not on a task) riders in the area */
    availableRiders: number;
    byVehicleType: Record<VehicleType, number>;
  };
  /** Fewest riders a cell may hold before it is merged into its coarser parent */
  minRidersPerCell: number;
  /** True when more occupied cells existed than one snapshot reads */
  capped: boolean;
  generatedAt: ISOTimestamp;
  /** Snapshots are cached; polling faster than this returns the same data */
  refreshAfterSeconds: number;
}
