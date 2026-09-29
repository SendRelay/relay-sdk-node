/**
 * Webhooks resource for webhook management operations
 *
 * @module resources/webhooks
 */

import type {
  CreateWebhookRequest,
  CreateWebhookResponse,
  ListWebhooksResponse,
  UpdateWebhookRequest,
  Webhook,
  WebhookSignatureVerification,
} from '../types';
import type { HttpClient, RequestConfig } from '../utils/http';

/**
 * Webhooks resource providing webhook management operations
 */
export class Webhooks {
  constructor(private readonly http: HttpClient) {}

  private withDeveloperAuth(developerToken?: string): RequestConfig | undefined {
    if (!developerToken) return undefined;

    const token = developerToken.startsWith('Bearer ')
      ? developerToken
      : `Bearer ${developerToken}`;

    return { headers: { Authorization: token } };
  }

  /**
   * Register a new webhook endpoint
   *
   * @param request - Webhook registration details
   * @param options - Legacy optional developer token; SDK API key is still required
   * @returns Webhook with signing secret (shown only once)
   *
   * @example
   * ```typescript
   * const webhook = await relay.webhooks.create({
   *   url: 'https://myapp.com/webhooks/relay',
   *   events: [
   *     'task.status.assigned',
   *     'task.status.completed',
   *     'payment.released',
   *   ],
   *   description: 'Production webhook',
   *   mode: 'live',
   * });
   *
   * // IMPORTANT: Save the secret - it's only shown once!
   * // Store webhook.secret securely; it is returned once.
   * ```
   */
  async create(
    request: CreateWebhookRequest,
    options?: { developerToken?: string },
  ): Promise<CreateWebhookResponse> {
    return this.http.post<CreateWebhookResponse>(
      '/sdk/webhooks',
      request,
      this.withDeveloperAuth(options?.developerToken),
    );
  }

  /**
   * List all webhooks
   *
   * @param options - Optional dashboard developer token override
   * @returns Paginated list of webhooks
   *
   * @example
   * ```typescript
   * const webhooks = await relay.webhooks.list();
   * for (const webhook of webhooks.data) {
   *   console.log(webhook.id, webhook.url, webhook.events);
   * }
   * ```
   */
  async list(options?: { developerToken?: string }): Promise<ListWebhooksResponse> {
    return this.http.get<ListWebhooksResponse>(
      '/sdk/webhooks',
      this.withDeveloperAuth(options?.developerToken),
    );
  }

  /**
   * Get webhook by ID
   *
   * @param webhookId - Webhook ID
   * @param options - Optional dashboard developer token override
   * @returns Webhook details (without secret)
   *
   * @example
   * ```typescript
   * const webhook = await relay.webhooks.get('webhook-123');
   * console.log('Mode:', webhook.mode);
   * console.log('Last used:', webhook.usage.lastUsed);
   * ```
   */
  async get(webhookId: string, options?: { developerToken?: string }): Promise<Webhook> {
    return this.http.get<Webhook>(
      `/sdk/webhooks/${webhookId}`,
      this.withDeveloperAuth(options?.developerToken),
    );
  }

  /**
   * Update webhook configuration
   *
   * @param webhookId - Webhook ID
   * @param request - Update details
   * @param options - Optional dashboard developer token override
   * @returns Updated webhook
   *
   * @example
   * ```typescript
   * await relay.webhooks.update('webhook-123', {
   *   events: [
   *     'task.status.completed',
   *     'task.status.failed',
   *     'payment.disputed',
   *   ],
   *   description: 'Updated to include disputes',
   * });
   * ```
   */
  async update(
    webhookId: string,
    request: UpdateWebhookRequest,
    options?: { developerToken?: string },
  ): Promise<Webhook> {
    return this.http.put<Webhook>(
      `/sdk/webhooks/${webhookId}`,
      request,
      this.withDeveloperAuth(options?.developerToken),
    );
  }

  /**
   * Delete webhook
   *
   * @param webhookId - Webhook ID
   * @param options - Optional dashboard developer token override
   *
   * @example
   * ```typescript
   * await relay.webhooks.delete('webhook-123');
   * ```
   */
  async delete(webhookId: string, options?: { developerToken?: string }): Promise<Webhook> {
    return this.http.delete<Webhook>(
      `/sdk/webhooks/${webhookId}`,
      this.withDeveloperAuth(options?.developerToken),
    );
  }

  /**
   * Verify webhook signature (for use in your webhook endpoint)
   *
   * Use this method in your webhook handler to verify that the request
   * actually came from Relay and hasn't been tampered with.
   *
   * @param payload - Raw request body as string
   * @param signatureHeader - X-Relay-Signature header value
   * @param secret - Your webhook secret
   * @param tolerance - Time tolerance in seconds (default: 300)
   * @returns Verification result
   *
   * @example
   * ```typescript
   * // In your Express webhook endpoint:
   * import express from 'express';
   *
   * const app = express();
   *
   * app.post('/webhooks/relay',
   *   express.raw({ type: 'application/json' }),
   *   (req, res) => {
   *     const payload = req.body.toString();
   *     const signature = req.headers['x-relay-signature'] as string;
   *
   *     const result = relay.webhooks.verifySignature(
   *       payload,
   *       signature,
   *       process.env.WEBHOOK_SECRET!
   *     );
   *
   *     if (!result.valid) {
   *       console.error('Invalid signature:', result.error);
   *       return res.status(401).send('Invalid signature');
   *     }
   *
   *     const event = JSON.parse(payload);
   *
   *     switch (event.type) {
   *       case 'task.status.assigned':
   *         console.log('Task assigned:', event.data);
   *         // Update database...
   *         break;
   *       case 'task.status.completed':
   *         console.log('Task completed:', event.data);
   *         // Send confirmation email...
   *         break;
   *       case 'payment.released':
   *         console.log('Payment released:', event.data);
   *         // Update accounting...
   *         break;
   *     }
   *
   *     res.status(200).send('OK');
   *   }
   * );
   * ```
   */
  verifySignature(
    payload: string,
    signatureHeader: string,
    secret: string,
    tolerance = 300,
  ): WebhookSignatureVerification {
    return this.http.verifyWebhookSignature(payload, signatureHeader, secret, tolerance);
  }
}
