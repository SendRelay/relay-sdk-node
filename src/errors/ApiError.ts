import { RelayError } from './RelayError';

/**
 * API error from Relay backend (4xx, 5xx HTTP responses)
 *
 * @example
 * ```typescript
 * try {
 *   await relay.tasks.create({...});
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(`API Error ${error.statusCode}:`, error.message);
 *     console.error('Error code:', error.code);
 *     console.error('Details:', error.details);
 *   }
 * }
 * ```
 */
export class ApiError extends RelayError {
	/**
	 * HTTP status code (e.g., 404, 500)
	 */
	public readonly statusCode: number;

	/**
	 * Error code from the API (e.g., 'INSUFFICIENT_FUNDS', 'TASK_NOT_FOUND')
	 */
	public readonly code: string;

	/**
	 * Additional error details from the API
	 */
	public readonly details?: any;

	constructor(
		statusCode: number,
		code: string,
		message: string,
		details?: any
	) {
		super(message);
		this.name = 'ApiError';
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;
	}

	/**
	 * Returns true if this is a client error (4xx)
	 */
	get isClientError(): boolean {
		return this.statusCode >= 400 && this.statusCode < 500;
	}

	/**
	 * Returns true if this is a server error (5xx)
	 */
	get isServerError(): boolean {
		return this.statusCode >= 500;
	}

	/**
	 * Returns true if this error is retryable
	 */
	get isRetryable(): boolean {
		// Server errors and 408 (Request Timeout), 429 (Too Many Requests) are retryable
		return (
			this.isServerError ||
			this.statusCode === 408 ||
			this.statusCode === 429
		);
	}

	/**
	 * Returns a JSON representation of the error
	 */
	toJSON(): Record<string, any> {
		return {
			name: this.name,
			statusCode: this.statusCode,
			code: this.code,
			message: this.message,
			...(this.details && { details: this.details }),
		};
	}
}
