/**
 * Insurance claim types. A claim is for the value of insured goods lost, stolen or damaged after the
 * rider collected them. Amounts are in kobo.
 *
 * @module types/claim
 */

/** What happened to the goods. */
export type ClaimIncidentType = 'LOST' | 'STOLEN' | 'DAMAGED';

/**
 * Where a claim is. `NEEDS_INFO`: SendRelay asked you for more (see `infoRequest`); answer with
 * `claims.respond`. `WITH_INSURER`: the insurer is deciding. `PAID`: the approved amount is in your wallet.
 */
export type ClaimStatus = 'SUBMITTED' | 'NEEDS_INFO' | 'WITH_INSURER' | 'APPROVED' | 'DECLINED' | 'PAID' | 'WITHDRAWN';

/** A file you uploaded with `claims.createUpload`, by its `key`, with the name to show for it. */
export interface ClaimFile {
  key: string;
  name: string;
}

/** A claim, as you see it. */
export interface Claim {
  id: string;
  /** What SendRelay and the insurer quote, like `CLM-7KQ2M-X4P9R`. */
  reference: string;
  status: ClaimStatus;
  incidentType: ClaimIncidentType;
  /** `YYYY-MM-DD` */
  incidentDate: string;
  claimedAmount: number;
  /** Set once approved. Can be less than `claimedAmount`. */
  approvedAmount: number | null;
  description: string;
  files: { name: string }[];
  /** What SendRelay asked you for, while `NEEDS_INFO`. */
  infoRequest: string | null;
  /** Why it was approved or declined. */
  decisionReason: string | null;
  /** Lagos dates, `YYYY-MM-DD`. */
  filedOn: string | null;
  decidedOn: string | null;
  paidOn: string | null;
}

/** A task's claim, or whether you can file one. */
export interface ClaimState {
  claim: Claim | null;
  canFile: boolean;
  /** Why not, when `canFile` is false and there is no claim. */
  reason: string | null;
  /** The most you can claim. Null when the task isn't insured. */
  insuredValue: number | null;
  certificateNumber: string | null;
  /** The last day to file, `YYYY-MM-DD`. */
  closesOn: string | null;
}

export interface FileClaimRequest {
  incidentType: ClaimIncidentType;
  /** `YYYY-MM-DD`, not in the future. */
  incidentDate: string;
  /** In kobo, up to the task's `insuredValue`. */
  claimedAmount: number;
  /** What happened, 20 to 4,000 characters. */
  description: string;
  /** Up to 10 files from `claims.createUpload`. */
  files?: ClaimFile[];
}

export interface RespondToClaimRequest {
  message: string;
  files?: ClaimFile[];
}

export type ClaimFileContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export interface CreateClaimUploadRequest {
  contentType: ClaimFileContentType;
}

/** PUT the file to `uploadUrl` with `Content-Type: contentType` before `expiresAt`, then send `key`. */
export interface ClaimUpload {
  uploadUrl: string;
  key: string;
  contentType: ClaimFileContentType;
  /** In bytes. */
  maxFileSize: number;
  expiresAt: string;
}
