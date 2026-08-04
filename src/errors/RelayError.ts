/**
 * Base error class for all Relay SDK errors
 *
 * @example
 * ```typescript
 * try {
 *   await relay.tasks.create({...});
 * } catch (error) {
 *   if (error instanceof RelayError) {
 *     console.error('Relay SDK error:', error.message);
 *   }
 * }
 * ```
 */
export class RelayError extends Error {
	/**
	 * The underlying cause of this error, if any
	 */
	public readonly cause?: Error;

	constructor(message: string, cause?: Error) {
		super(message);
		this.name = 'RelayError';
		this.cause = cause;

		// Maintains proper stack trace for where error was thrown (V8 only)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
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
