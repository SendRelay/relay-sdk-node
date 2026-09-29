# Relay Node.js SDK

[![npm version](https://img.shields.io/npm/v/@relay-sdk/sdk-node.svg)](https://www.npmjs.com/package/@relay-sdk/sdk-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official server SDK for Relay.

This package is for backend/server environments only. It uses your Relay API key and should never run in browsers or mobile apps.

## Install

```bash
npm install @relay-sdk/sdk-node
# or
pnpm add @relay-sdk/sdk-node
# or
yarn add @relay-sdk/sdk-node
```

## Requirements

- Node.js `>=18`
- Relay API key: `sk_live_...` or `sk_test_...`

## Quick Start

```ts
import { RelayClient } from '@relay-sdk/sdk-node';

const relay = new RelayClient({
  apiKey: process.env.RELAY_API_KEY!,
});

const result = await relay.tasks.create({
  taskType: 'PACKAGE_DELIVERY',
  stages: [
    {
      type: 'PICKUP',
      location: {
        latitude: 6.5244,
        longitude: 3.3792,
        address: 'Pickup address',
      },
      instructions: 'Call on arrival',
      items: [
        {
          name: 'Parcel',
          estimatedValue: 200000,
          estimatedWeight: 'STANDARD',
          estimatedSize: 'BOX',
        },
      ],
    },
    {
      type: 'DROPOFF',
      location: {
        latitude: 6.4281,
        longitude: 3.4219,
        address: 'Dropoff address',
      },
      instructions: 'Drop with security',
    },
  ],
});

console.log(result.task.taskId, result.task.status, result.task.totalFee);
```

## Client Configuration

```ts
const relay = new RelayClient({
  apiKey: process.env.RELAY_API_KEY!,
  baseUrl: 'https://api.sendrelay.com.ng',
  apiVersion: 'v1',
  timeout: 30_000,
  maxRetries: 3,
  retry: {
    enabled: true,
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 10_000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
  idempotency: {
    autoGenerate: true,
  },
  headers: {
    'X-My-Header': 'value',
  },
});
```

Notes:
- The SDK sends API key in `X-Relay-Key`.
- Successful responses are unwrapped from `{ data: ... }` automatically when present.
- For POST requests, the SDK auto-generates `Idempotency-Key` unless you set one.

## Tasks API

```ts
// Quote
const quote = await relay.tasks.quote({
  taskType: 'PACKAGE_DELIVERY',
  stages: [
    {
      type: 'PICKUP',
      location: { latitude: 6.52, longitude: 3.37, address: 'A' },
      instructions: 'Pickup',
      items: [{ name: 'Parcel', estimatedValue: 100000, estimatedWeight: 'STANDARD', estimatedSize: 'BOX' }],
    },
    {
      type: 'DROPOFF',
      location: { latitude: 6.42, longitude: 3.42, address: 'B' },
      instructions: 'Dropoff',
    },
  ],
});

// quote-lock fields are additive
const { quoteId, expiresAt, quoteTtlSeconds } = quote;

// Create (explicit idempotency key)
const created = await relay.tasks.create(
  {
    taskType: 'PACKAGE_DELIVERY',
    quoteId, // optional: enforce locked quote pricing
    stages: [
      {
        type: 'PICKUP',
        location: { latitude: 6.52, longitude: 3.37, address: 'A' },
        instructions: 'Pickup',
        items: [{ name: 'Parcel', estimatedValue: 100000, estimatedWeight: 'STANDARD', estimatedSize: 'BOX' }],
      },
      {
        type: 'DROPOFF',
        location: { latitude: 6.42, longitude: 3.42, address: 'B' },
        instructions: 'Dropoff',
      },
    ],
  },
  { idempotencyKey: 'order-123-delivery' }
);

// List (paged)
const page = await relay.tasks.list({ limit: 20, order: 'desc' });

// List all (auto-pagination)
for await (const t of relay.tasks.listAll({ limit: 20 })) {
  console.log(t.id);
}

// Get
const one = await relay.tasks.get(created.task.taskId);

// Cancel
await relay.tasks.cancel(created.task.taskId, { reason: 'Customer request' });

// Assign manually
await relay.tasks.assign(created.task.taskId, { riderId: 'rider-uuid' });

// Rate
await relay.tasks.rate(created.task.taskId, { rating: 5, comment: 'Great service' });

// Dispute
await relay.tasks.dispute(created.task.taskId, {
  reason: 'DAMAGED_ITEMS',
  description: 'Package arrived damaged',
  evidence: ['https://example.com/photo.jpg'],
});

// Nearby riders
const nearby = await relay.tasks.availableRiders(created.task.taskId, { tier: 1 });
```

## Webhooks API

Webhook management calls use `X-Relay-Key` on `/v1/sdk/webhooks`. Complete onboarding and obtain a `VERIFIED` business profile before create, update, or delete, including for `mode: 'test'`. Test keys do not bypass this gate. List and get require a valid API key but do not invoke the profile-verification gate. The signed-in dashboard uses `/v1/developer/webhooks`; inbound payment provider callbacks use `/v1/webhooks/stripe` and `/v1/webhooks/flutterwave`. A developer JWT alone does not authorize SDK webhook CRUD. While approval is pending, use the [local signed receiver fixture](../../../apps/docs/static/examples/webhook-local-fixture.mjs); its events are locally generated, not Relay-delivered sandbox events.

```ts
// Create
const webhook = await relay.webhooks.create({
  url: 'https://yourapp.com/webhooks/relay',
  events: ['task.status.completed', 'task.status.failed'],
  description: 'Test webhook',
  mode: 'test',
});

// Store webhook.secret securely once; never log it.

// List / Get / Update / Delete
await relay.webhooks.list();
await relay.webhooks.get(webhook.id);
await relay.webhooks.update(webhook.id, {
  events: ['task.status.completed', 'task.status.failed'],
});
await relay.webhooks.delete(webhook.id);
```

After registering a test endpoint with a `sk_test_...` key, create a test task with `simulationOutcome: 'SUCCESS'` to exercise matching test-mode lifecycle events. See the [simulation guide](../../../apps/docs/docs/simulation/index.md). The local fixture does not send Relay events.

### Verify Webhook Signature

Use the raw request body string, not parsed JSON.

```ts
import express from 'express';
import { RelayClient } from '@relay-sdk/sdk-node';

const relay = new RelayClient({ apiKey: process.env.RELAY_API_KEY! });
const app = express();

app.post('/webhooks/relay', express.raw({ type: 'application/json' }), (req, res) => {
  const payload = req.body.toString('utf8');
  const signature = req.header('x-relay-signature') || '';

  const result = relay.webhooks.verifySignature(
    payload,
    signature,
    process.env.RELAY_WEBHOOK_SECRET!
  );

  if (!result.valid) {
    return res.status(401).send(`Invalid signature: ${result.error}`);
  }

  const event = JSON.parse(payload);
  // handle event...
  res.status(200).send('ok');
});
```

## WebSocket Token Generation

Use this on your backend to mint scoped tokens for browser/mobile SDKs.

```ts
const wsToken = await relay.auth.createWebSocketToken({
  scope: ['task:task-123', 'task:task-456'],
  expiresIn: 1800, // seconds (60..7200)
});

// Send wsToken.token to client
```

Rules:
- `scope` is required and each item must be `type:id`.
- `expiresIn` must be between `60` and `7200` seconds.

## Error Handling

```ts
import {
  ApiError,
  NetworkError,
  ValidationError,
} from '@relay-sdk/sdk-node';

try {
  await relay.tasks.create({ /* ... */ } as any);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message, error.field);
  } else if (error instanceof NetworkError) {
    console.error('Network/timeout error:', error.message);
  } else if (error instanceof ApiError) {
    console.error('Relay API error:', error.statusCode, error.code, error.message);
    console.error('Details:', error.details);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Money Format

All monetary amounts are in **kobo** (`100 kobo = ₦1.00`).

```ts
const totalKobo = 575663;
const totalNaira = (totalKobo / 100).toFixed(2); // "5756.63"
```

## Related SDKs

- Browser real-time client: `@relay-sdk/sdk-browser`
- Flutter real-time client: `relay_flutter`

## License

MIT
