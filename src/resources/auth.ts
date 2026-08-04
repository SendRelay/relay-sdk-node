/**
 * Auth resource - WebSocket token management
 *
 * @module resources/auth
 */

import { ValidationError } from '../errors';
import type { HttpClient } from '../utils/http';

/**
 * WebSocket token request options
 */
export interface CreateWebSocketTokenRequest {
  /**
   * Array of resources to grant access to
   * Format: "type:id" (e.g., ["task:abc123", "task:def456"])
   */
  scope: string[];

  /**
   * Token expiration time in seconds
   * Min: 60, Max: 7200, Default: 1800 (30 minutes)
   */
  expiresIn?: number;
}

/**
 * WebSocket token response
 */
export interface WebSocketToken {
  /** JWT token for WebSocket authentication */
  token: string;
  /** Token expiration time in seconds */
  expiresIn: number;
  /** Token expiration timestamp (ISO 8601) */
  expiresAt: string;
  /** Resources this token grants access to */
  scope: string[];
}

/**
 * Auth Resource
 *
 * Provides authentication methods for WebSocket connections.
 *
 * @example
 * ```typescript
 * // Create a session token for browser client
 * const sessionToken = await relay.auth.createWebSocketToken({
 *   scope: ['task:task-123'],
 *   expiresIn: 1800, // 30 minutes
 * });
 *
 * // Send token to browser client
 * res.json({ token: sessionToken.token });
 * ```
 */
export class Auth {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create WebSocket session token
   *
   * Exchanges your API key for a short-lived scoped JWT token
   * that your browser/mobile clients can use to connect to WebSocket.
   *
   * **Use Case:** Your backend receives a request from your client,
   * validates the user, then creates a session token scoped to
   * the tasks/riders that user should have access to.
   *
   * @param request - Token creation options
   * @returns WebSocket token for client use
   *
   * @throws {ValidationError} If scope is empty or invalid
   * @throws {ApiError} If API request fails
   *
   * @example
   * ```typescript
   * // In your backend API endpoint
   * app.post('/api/relay/token', async (req, res) => {
   *   const { taskId } = req.body;
   *   const userId = req.session.userId; // Your auth
   *
   *   // Verify user owns this task
   *   const task = await db.tasks.findOne({ id: taskId, userId });
   *   if (!task) return res.status(403).json({ error: 'Forbidden' });
   *
   *   // Create Relay session token
   *   const token = await relay.auth.createWebSocketToken({
   *     scope: [`task:${taskId}`],
   *     expiresIn: 1800, // 30 minutes
   *   });
   *
   *   res.json(token);
   * });
   * ```
   */
  async createWebSocketToken(request: CreateWebSocketTokenRequest): Promise<WebSocketToken> {
    // Validation
    if (!request.scope || request.scope.length === 0) {
      throw new ValidationError('scope must contain at least one resource');
    }

    // Validate scope format
    for (const resource of request.scope) {
      const parts = resource.split(':');
      if (parts.length !== 2) {
        throw new ValidationError(
          `Invalid scope format: "${resource}". Expected "type:id" (e.g., "task:abc123")`,
        );
      }

      const [type, id] = parts;
      if (!type || !id) {
        throw new ValidationError(
          `Invalid scope format: "${resource}". Both type and id must be non-empty`,
        );
      }

      // Backend enforces max scoped task IDs per resource token.
      // Example accepted: "task:task-1,task-2"
      if (type === 'task') {
        const taskIds = id.split(',');
        if (taskIds.length > 5) {
          throw new ValidationError(`Scoped tasks cannot exceed 5 per scope entry: "${resource}"`);
        }
      }
    }

    if (request.expiresIn !== undefined) {
      if (request.expiresIn < 60 || request.expiresIn > 7200) {
        throw new ValidationError('expiresIn must be between 60 and 7200 seconds');
      }
    }

    // Make API request
    return this.http.request<WebSocketToken>('POST', '/auth/websocket-token', {
      scope: request.scope,
      expiresIn: request.expiresIn ?? 1800,
    });
  }
}
