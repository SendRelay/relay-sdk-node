/**
 * Main Relay SDK client for server-side integration
 *
 * @module client
 */

import { ValidationError } from './errors';
import { Auth } from './resources/auth';
import { Tasks } from './resources/tasks';
import { Webhooks } from './resources/webhooks';
import { HttpClient, type HttpClientOptions } from './utils/http';

/**
 * Relay SDK client configuration options
 */
export interface RelayClientOptions {
  /**
   * API key for authentication (sk_live_... or sk_test_...)
   * @required
   */
  apiKey: string;

  /**
   * Base URL for API (defaults to production)
   * Override for custom deployments or local development
   */
  baseUrl?: string;

  /**
   * API version to use (defaults to latest version)
   */
  apiVersion?: string;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;

  /**
   * Retry configuration
   */
  retry?: {
    /** Enable/disable retries (default: true) */
    enabled?: boolean;
    /** Maximum retry attempts (default: 3) */
    maxRetries?: number;
    /** Initial delay in milliseconds (default: 500) */
    initialDelayMs?: number;
    /** Maximum delay in milliseconds (default: 10000) */
    maxDelayMs?: number;
    /** Backoff multiplier (default: 2) */
    backoffMultiplier?: number;
    /** Retryable HTTP status codes */
    retryableStatusCodes?: number[];
  };

  /**
   * Idempotency configuration
   */
  idempotency?: {
    /** Auto-generate idempotency keys for POST requests (default: true) */
    autoGenerate?: boolean;
  };

  /**
   * Custom headers to include in all requests
   */
  headers?: Record<string, string>;

  /**
   * Logging configuration
   */
  logger?: {
    debug?: (message: string, meta?: any) => void;
    info?: (message: string, meta?: any) => void;
    warn?: (message: string, meta?: any) => void;
    error?: (message: string, meta?: any) => void;
  };
}

/**
 * Main Relay SDK client for server-side integration
 *
 * @example
 * ```typescript
 * import { RelayClient } from '@relay-sdk/sdk-node';
 *
 * const relay = new RelayClient({
 *   apiKey: process.env.RELAY_API_KEY,
 * });
 *
 * // Create a task
 * const result = await relay.tasks.create({
 *   taskType: 'PACKAGE_DELIVERY',
 *   stages: [
 *     { type: 'PICKUP', location: { ... } },
 *     { type: 'DROPOFF', location: { ... } },
 *   ],
 * });
 *
 * console.log(result.task.taskId);
 *
 * // List tasks
 * for await (const task of relay.tasks.listAll({ limit: 30 })) {
 *   console.log(task.id);
 * }
 * ```
 */
export class RelayClient {
  private readonly http: HttpClient;
  private readonly baseUrl = 'https://api.sendrelay.com.ng' as const;
  private readonly version = 'v1' as const;

  /**
   * Tasks resource namespace
   *
   * Provides methods for task management:
   * - create, quote, get, list, cancel
   * - assign, rate, dispute
   * - availableRiders
   */
  public readonly tasks: Tasks;

  /**
   * Webhooks resource namespace
   *
   * Provides methods for webhook management:
   * - create, get, list, update, delete
   * - verifySignature
   */
  public readonly webhooks: Webhooks;

  /**
   * Auth resource namespace
   *
   * Provides authentication methods:
   * - createWebSocketToken (for browser/mobile clients)
   */
  public readonly auth: Auth;

  constructor(options: RelayClientOptions) {
    // Validate API key
    if (!options.apiKey) {
      throw new ValidationError('API key is required');
    }

    if (!options.apiKey.startsWith('sk_live_') && !options.apiKey.startsWith('sk_test_')) {
      throw new ValidationError('Invalid API key format. Must start with sk_live_ or sk_test_');
    }

    // Build HTTP client options
    const httpOptions: HttpClientOptions = {
      baseUrl: options.baseUrl || this.baseUrl,
      apiVersion: options.apiVersion || this.version,
      apiKey: options.apiKey,
      timeout: options.timeout || 30000,
      retry: {
        enabled: options.retry?.enabled ?? true,
        maxRetries: options.retry?.maxRetries ?? options.maxRetries ?? 3,
        initialDelayMs: options.retry?.initialDelayMs ?? 500,
        maxDelayMs: options.retry?.maxDelayMs ?? 10000,
        backoffMultiplier: options.retry?.backoffMultiplier ?? 2,
        retryableStatusCodes: options.retry?.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504],
      },
      idempotency: {
        autoGenerate: options.idempotency?.autoGenerate ?? true,
      },
      headers: options.headers || {},
      logger: options.logger,
    };

    // Initialize HTTP client
    this.http = new HttpClient(httpOptions);

    // Initialize resource namespaces
    this.tasks = new Tasks(this.http);
    this.webhooks = new Webhooks(this.http);
    this.auth = new Auth(this.http);
  }

  /**
   * Get environment info (live vs test mode)
   *
   * @returns 'live' for production keys, 'test' for test keys
   *
   * @example
   * ```typescript
   * if (relay.environment === 'live') {
   *   console.log('Using production API');
   * }
   * ```
   */
  public get environment(): 'live' | 'test' {
    return this.http.getApiKey().startsWith('sk_live_') ? 'live' : 'test';
  }

  /**
   * Update client configuration
   *
   * @param options - Partial configuration to update
   *
   * @example
   * ```typescript
   * // Increase timeout for large uploads
   * relay.configure({ timeout: 60000 });
   *
   * // Add custom headers
   * relay.configure({
   *   headers: { 'X-Custom-Header': 'value' }
   * });
   * ```
   */
  public configure(options: Partial<RelayClientOptions>): void {
    if (options.timeout !== undefined) {
      this.http.setTimeout(options.timeout);
    }
    if (options.maxRetries !== undefined) {
      this.http.setMaxRetries(options.maxRetries);
    }
    if (options.headers) {
      this.http.setHeaders(options.headers);
    }
  }
}
