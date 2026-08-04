/**
 * HTTP client with retry logic, exponential backoff, and resilience features
 *
 * @module utils/http
 */

import * as crypto from 'crypto';
import { ApiError, NetworkError } from '../errors';
import type { WebhookSignatureVerification } from '../types';

/**
 * HTTP client configuration options
 */
export interface HttpClientOptions {
  /** Base URL for the API */
  baseUrl: string;
  /** API version (e.g., 'v1') */
  apiVersion: string;
  /** API key for authentication */
  apiKey: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Retry configuration */
  retry: {
    /** Whether retries are enabled */
    enabled: boolean;
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Initial retry delay in milliseconds */
    initialDelayMs: number;
    /** Maximum retry delay in milliseconds */
    maxDelayMs: number;
    /** Backoff multiplier */
    backoffMultiplier: number;
    /** HTTP status codes that should trigger a retry */
    retryableStatusCodes: number[];
  };
  /** Idempotency configuration */
  idempotency: {
    /** Whether to auto-generate idempotency keys */
    autoGenerate: boolean;
  };
  /** Custom headers to include in all requests */
  headers: Record<string, string>;
  /** Logger implementation */
  logger?: {
    debug?: (message: string, meta?: any) => void;
    info?: (message: string, meta?: any) => void;
    warn?: (message: string, meta?: any) => void;
    error?: (message: string, meta?: any) => void;
  };
}

/**
 * Request configuration
 */
export interface RequestConfig {
  /** Custom headers for this request */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, any>;
  /** Request body (for DELETE requests) */
  data?: any;
}

/**
 * HTTP client with automatic retry logic and resilience features
 */
export class HttpClient {
  private readonly options: HttpClientOptions;

  constructor(options: HttpClientOptions) {
    this.options = options;
  }

  /**
   * Perform a GET request
   */
  async get<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', path, undefined, config);
  }

  /**
   * Perform a POST request
   */
  async post<T>(path: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', path, data, config);
  }

  /**
   * Perform a PUT request
   */
  async put<T>(path: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', path, data, config);
  }

  /**
   * Perform a DELETE request
   */
  async delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', path, config?.data, config);
  }

  /**
   * Perform an HTTP request with retry logic
   */
  public async request<T>(
    method: string,
    path: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const url = this.buildUrl(path, config?.params);
    const headers = this.buildHeaders(method, config);

    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt <= this.options.retry.maxRetries) {
      try {
        this.log('debug', `${method} ${url} (attempt ${attempt + 1})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Success response
        if (response.ok) {
          const result = (await response.json()) as any;
          this.log('debug', `${method} ${url} succeeded`, {
            status: response.status,
          });
          return result.data || result;
        }

        // Error response
        const errorBody = (await response.json().catch(() => ({}))) as any;
        const error = new ApiError(
          response.status,
          errorBody.error?.code || 'UNKNOWN_ERROR',
          errorBody.error?.message || response.statusText,
          errorBody.error?.details,
        );

        // Check if retryable
        if (
          this.options.retry.enabled &&
          attempt < this.options.retry.maxRetries &&
          this.isRetryable(error)
        ) {
          const delay = this.calculateBackoff(attempt);
          this.log('warn', `Retrying ${method} ${url} after ${delay}ms`, {
            error: error.message,
            attempt: attempt + 1,
            statusCode: error.statusCode,
          });
          await this.sleep(delay);
          attempt++;
          lastError = error;
          continue;
        }

        throw error;
      } catch (err) {
        // Network error (fetch failed or timeout)
        if (err instanceof TypeError || (err as any).name === 'AbortError') {
          const networkError = new NetworkError(
            (err as any).name === 'AbortError'
              ? `Request timeout after ${this.options.timeout}ms`
              : 'Network error - connection failed',
            err as Error,
          );

          // Retry network errors
          if (this.options.retry.enabled && attempt < this.options.retry.maxRetries) {
            const delay = this.calculateBackoff(attempt);
            this.log('warn', `Retrying ${method} ${url} after ${delay}ms (network error)`, {
              attempt: attempt + 1,
            });
            await this.sleep(delay);
            attempt++;
            lastError = networkError;
            continue;
          }

          throw networkError;
        }

        // Other errors (ApiError, etc.) - rethrow
        throw err;
      }
    }

    // Max retries exceeded
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, any>): string {
    const baseUrl = `${this.options.baseUrl}/${this.options.apiVersion}${path}`;

    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(method: string, config?: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Relay-Key': this.options.apiKey,
      'User-Agent': `@relay-sdk/sdk-node/${this.getVersion()}`,
      ...this.options.headers,
      ...config?.headers,
    };

    // Auto-generate idempotency key for POST requests
    if (method === 'POST' && this.options.idempotency.autoGenerate && !headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = this.generateIdempotencyKey();
    }

    return headers;
  }

  /**
   * Generate idempotency key
   */
  private generateIdempotencyKey(): string {
    return `sdk-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: ApiError): boolean {
    return this.options.retry.retryableStatusCodes.includes(error.statusCode);
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoff(attempt: number): number {
    const delay = Math.min(
      this.options.retry.initialDelayMs * this.options.retry.backoffMultiplier ** attempt,
      this.options.retry.maxDelayMs,
    );

    // Add jitter (±25% randomization to prevent thundering herd)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log message using configured logger
   */
  private log(level: string, message: string, meta?: any): void {
    const logger = this.options.logger;
    if (!logger) return;

    switch (level) {
      case 'debug':
        logger.debug?.(message, meta);
        break;
      case 'info':
        logger.info?.(message, meta);
        break;
      case 'warn':
        logger.warn?.(message, meta);
        break;
      case 'error':
        logger.error?.(message, meta);
        break;
    }
  }

  /**
   * Get SDK version (read from package.json in real implementation)
   */
  private getVersion(): string {
    return '1.0.0';
  }

  /**
   * Verify webhook signature
   *
   * @param payload - Raw request body as string
   * @param signatureHeader - X-Relay-Signature header value
   * @param secret - Webhook secret
   * @param tolerance - Time tolerance in seconds (default: 300)
   * @returns Verification result
   */
  verifyWebhookSignature(
    payload: string,
    signatureHeader: string,
    secret: string,
    tolerance = 300,
  ): WebhookSignatureVerification {
    try {
      // Parse signature header: "t=timestamp,v1=signature"
      const parts = signatureHeader.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signaturePart = parts.find((p) => p.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        return { valid: false, error: 'Invalid signature format' };
      }

      const timestamp = parseInt(timestampPart.split('=')[1]);
      const signature = signaturePart.split('=')[1];

      // Check timestamp tolerance
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > tolerance) {
        return { valid: false, error: 'Timestamp outside tolerance window' };
      }

      // Compute expected signature
      const secretKey = secret.replace('whsec_', '');
      const signedPayload = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', Buffer.from(secretKey, 'base64url'))
        .update(signedPayload, 'utf8')
        .digest('hex');

      // Constant-time comparison
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Signature verification failed' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update timeout configuration
   */
  setTimeout(timeout: number): void {
    this.options.timeout = timeout;
  }

  /**
   * Update max retries configuration
   */
  setMaxRetries(maxRetries: number): void {
    this.options.retry.maxRetries = maxRetries;
  }

  /**
   * Update custom headers
   */
  setHeaders(headers: Record<string, string>): void {
    Object.assign(this.options.headers, headers);
  }

  /**
   * Get the API key
   */
  getApiKey(): string {
    return this.options.apiKey;
  }
}
