/**
 * Common types shared across the SDK
 *
 * @module types/common
 */

/**
 * Geographic location coordinates
 */
export interface Location {
	/** Latitude in decimal degrees */
	latitude: number;
	/** Longitude in decimal degrees */
	longitude: number;
	/** Human-readable address (optional) */
	address: string;
}

/**
 * Contact information
 */
export interface Contact {
	/** Full name */
	name: string;
	/** Phone number (E.164 format recommended) */
	phone: string;
	/** Email address (optional) */
	email?: string;
}

/**
 * Paginated response metadata
 */
export interface PaginationMeta {
	/** Whether there are more results available */
	hasMore: boolean;
	/** Cursor for the next page (if hasMore is true) */
	cursor?: string;
	/** Total count (if available) */
	total?: number;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
	/** Array of items */
	data: T[];
	/** Pagination metadata */
	pagination: PaginationMeta;
}

/**
 * Standard API response wrapper
 */
export type ApiResponse<T> = {
		/** Whether the request was successful - when true; data is set */
		success: true;
		/** Response data */
		data: T;
	}
	|
	{
		/** Whether the request was successful - when false; error is set */
		success: false;
		/** Error information (if success is false) */
		error: {
			code: string;
			message: string;
			details?: any;
		};
	}

/**
 * Timestamp in ISO 8601 format
 */
export type ISOTimestamp = string;

/**
 * UUID string
 */
export type UUID = string;

/**
 * Amount in kobo (100 kobo = ₦1.00)
 */
export type AmountInKobo = number;
