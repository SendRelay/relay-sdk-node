/**
 * Insurance claims on a task, for insured goods lost, stolen or damaged after the rider collected them.
 * Test keys insure nothing, so their tasks can't be claimed on.
 *
 * @module resources/claims
 */

import type {
  Claim,
  ClaimState,
  ClaimUpload,
  CreateClaimUploadRequest,
  FileClaimRequest,
  RespondToClaimRequest,
} from '../types';
import type { HttpClient } from '../utils/http';

export class Claims {
  constructor(private readonly http: HttpClient) {}

  /**
   * A task's claim, or whether you can file one and until when.
   *
   * @example
   * ```typescript
   * const { claim, canFile, insuredValue, closesOn } = await relay.claims.get(taskId);
   * ```
   */
  async get(taskId: string): Promise<ClaimState> {
    return this.http.get<ClaimState>(`/sdk/tasks/${taskId}/claim`);
  }

  /**
   * Somewhere to upload one photo or PDF for a claim. PUT the file to `uploadUrl` with the same
   * `Content-Type`, then pass `{ key, name }` in `files`.
   *
   * @example
   * ```typescript
   * const upload = await relay.claims.createUpload(taskId, { contentType: 'image/jpeg' });
   * await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'Content-Type': upload.contentType }, body: photo });
   * ```
   */
  async createUpload(taskId: string, request: CreateClaimUploadRequest): Promise<ClaimUpload> {
    return this.http.post<ClaimUpload>(`/sdk/tasks/${taskId}/claim/evidence`, request);
  }

  /**
   * File a claim. One per task, once it has ended, for up to its insured value.
   *
   * @example
   * ```typescript
   * const claim = await relay.claims.file(taskId, {
   *   incidentType: 'STOLEN',
   *   incidentDate: '2026-11-07',
   *   claimedAmount: 1_500_000,
   *   description: 'The rider collected the phone and never reached the customer.',
   *   files: [{ key: upload.key, name: 'receipt.jpg' }],
   * });
   * ```
   */
  async file(taskId: string, request: FileClaimRequest): Promise<Claim> {
    return this.http.post<Claim>(`/sdk/tasks/${taskId}/claim`, request);
  }

  /** Answer SendRelay's request for more information, while the claim is `NEEDS_INFO`. */
  async respond(taskId: string, request: RespondToClaimRequest): Promise<Claim> {
    return this.http.post<Claim>(`/sdk/tasks/${taskId}/claim/respond`, request);
  }

  /** Withdraw a claim that is still being decided. You can file again afterwards. */
  async withdraw(taskId: string): Promise<Claim> {
    return this.http.post<Claim>(`/sdk/tasks/${taskId}/claim/withdraw`);
  }
}
