import { RelayError } from './RelayError';

/**
 * Input validation error (client-side validation failures)
 *
 * @example
 * ```typescript
 * try {
 *   await relay.tasks.create({
 *     taskType: 'INVALID_TYPE', // Invalid task type
 *     stages: [],
 *   });
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Validation error:', error.message);
 *     console.error('Invalid field:', error.field);
 *   }
 * }
 * ```
 */
export class ValidationError extends RelayError {
	/**
	 * The field that failed validation (if applicable)
	 */
	public readonly field?: string;

	constructor(message: string, field?: string) {
		super(message);
		this.name = 'ValidationError';
		this.field = field;
	}

	/**
	 * Returns a JSON representation of the error
	 */
	toJSON(): Record<string, any> {
		return {
			name: this.name,
			message: this.message,
			...(this.field && { field: this.field }),
		};
	}
}
