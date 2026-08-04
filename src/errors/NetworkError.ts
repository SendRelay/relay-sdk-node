import { RelayError } from './RelayError';

/**
 * Network connectivity error (timeouts, connection failures, etc.)
 *
 * @example
 * ```typescript
 * try {
 *   await relay.tasks.create({...});
 * } catch (error) {
 *   if (error instanceof NetworkError) {
 *     console.error('Network error:', error.message);
 *     console.error('Original error:', error.cause);
 *     // Retry or show offline message...
 *   }
 * }
 * ```
 */
export class NetworkError extends RelayError {
	constructor(message: string, cause?: Error) {
		super(message, cause);
		this.name = 'NetworkError';
	}

	/**
	 * Returns a JSON representation of the error
	 */
	toJSON(): Record<string, any> {
		return {
			name: this.name,
			message: this.message,
			...(this.cause && { cause: this.cause.message }),
		};
	}
}
