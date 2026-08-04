# WebSocket Authentication Guide

This guide shows how to set up secure WebSocket authentication for your frontend clients using the Relay SDK.

## Overview

WebSocket authentication uses a **two-step token exchange**:

1. **Backend** (Node.js): Exchanges API key for scoped session token
2. **Frontend** (Browser/Mobile): Uses session token to connect to WebSocket

```
┌─────────┐                ┌─────────────┐                ┌──────────────┐
│ Browser │                │ Your Server │                │  Relay API   │
└─────────┘                └─────────────┘                └──────────────┘
     │                            │                              │
     │  1. Request token          │                              │
     ├───────────────────────────>│                              │
     │                            │                              │
     │                            │  2. Exchange API key         │
     │                            ├─────────────────────────────>│
     │                            │     for session token        │
     │                            │                              │
     │                            │  3. Return session token     │
     │                            │<─────────────────────────────┤
     │  4. Return session token   │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
     │  5. Connect to WebSocket   │                              │
     ├────────────────────────────┼──────────────────────────────>
     │    with session token      │                              │
```

## Step 1: Create Token Exchange Endpoint (Backend)

### Express.js Example

```typescript
import { RelayClient } from '@relay-sdk/sdk-node';
import express from 'express';

const app = express();
const relay = new RelayClient({
  apiKey: process.env.RELAY_API_KEY,
});

app.post('/api/relay/token', async (req, res) => {
  try {
    const { taskIds } = req.body;  // Array of task IDs

    // 1. Authenticate your user (your existing auth)
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Verify user has access to ALL tasks (your business logic)
    const hasAccess = await yourDb.checkTaskAccess(userId, taskIds);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 3. Create Relay session token (scoped to these tasks)
    const token = await relay.auth.createWebSocketToken({
      scope: taskIds.map(id => `task:${id}`),  // Scope to multiple tasks
      expiresIn: 1800, // 30 minutes
    });

    // 4. Return token to client
    res.json(token);
  } catch (error) {
    console.error('Token creation failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Next.js API Route Example

```typescript
// pages/api/relay/token.ts
import { RelayClient } from '@relay-sdk/sdk-node';
import type { NextApiRequest, NextApiResponse } from 'next';

const relay = new RelayClient({
  apiKey: process.env.RELAY_API_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { taskIds } = req.body;  // Array of task IDs

    // Your auth check
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify task ownership for all tasks
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId: session.user.id,
      },
    });

    if (tasks.length !== taskIds.length) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Create Relay session token
    const token = await relay.auth.createWebSocketToken({
      scope: taskIds.map(id => `task:${id}`),  // Scope to multiple tasks
      expiresIn: 1800,
    });

    res.json(token);
  } catch (error) {
    console.error('Token creation failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### NestJS Example

```typescript
import { Controller, Post, Body, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { RelayClient } from '@relay-sdk/sdk-node';

@Controller('api/relay')
export class RelayController {
  private relay: RelayClient;

  constructor() {
    this.relay = new RelayClient({
      apiKey: process.env.RELAY_API_KEY,
    });
  }

  @Post('token')
  async createToken(
    @Body('taskIds') taskIds: string[],  // Array of task IDs
    @CurrentUser() user: User,
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    // Verify task ownership for all tasks
    const hasAccess = await this.tasksService.userHasAccessToAll(user.id, taskIds);
    if (!hasAccess) {
      throw new ForbiddenException();
    }

    // Create Relay session token
    const token = await this.relay.auth.createWebSocketToken({
      scope: taskIds.map(id => `task:${id}`),  // Scope to multiple tasks
      expiresIn: 1800,
    });

    return token;
  }
}
```

## Step 2: Request Token from Frontend

### React Example

```typescript
import { RelayRealtimeClient } from '@relay-sdk/sdk-browser';
import { useState, useEffect } from 'react';

function TaskTracker({ taskId }: { taskId: string }) {
  const [taskStatus, setTaskStatus] = useState('');
  const [relay] = useState(() =>
    new RelayRealtimeClient({
      getToken: async (taskIds) => {
        // SDK calls this with array of task IDs needing tokens
        const response = await fetch('/api/relay/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds }),
        });

        if (!response.ok) {
          throw new Error('Failed to get token');
        }

        return (await response.json()).token;
      },
    })
  );

  useEffect(() => {
    // Single call - SDK handles token fetch, connection, and subscription
    relay.listen(taskId);

    // Listen for task updates
    relay.on('TASK_ASSIGNED', (event) => {
      setTaskStatus(`Assigned to rider ${event.riderId}`);
    });

    relay.on('TASK_IN_PROGRESS', (event) => {
      setTaskStatus('In progress');
    });

    relay.on('TASK_COMPLETED', (event) => {
      setTaskStatus('Completed');
    });

    // Cleanup
    return () => {
      relay.stopListening(taskId);
    };
  }, [taskId, relay]);

  return <div>Task Status: {taskStatus}</div>;
}
```

### Vue Example

```vue
<template>
  <div>Task Status: {{ taskStatus }}</div>
</template>

<script setup lang="ts">
import { RelayRealtimeClient } from '@relay-sdk/sdk-browser';
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{ taskId: string }>();
const taskStatus = ref('');

const relay = new RelayRealtimeClient({
  getToken: async (taskIds) => {
    // SDK calls this with array of task IDs needing tokens
    const response = await fetch('/api/relay/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds }),
    });

    return (await response.json()).token;
  },
});

onMounted(async () => {
  try {
    // Single call - SDK handles token fetch, connection, and subscription
    await relay.listen(props.taskId);

    // Listen for events
    relay.on('TASK_ASSIGNED', (event) => {
      taskStatus.value = `Assigned to ${event.riderId}`;
    });

    relay.on('TASK_IN_PROGRESS', () => {
      taskStatus.value = 'In progress';
    });

    relay.on('TASK_COMPLETED', () => {
      taskStatus.value = 'Completed';
    });
  } catch (error) {
    console.error('Relay setup failed:', error);
  }
});

onUnmounted(() => {
  relay.stopListening(props.taskId);
});
</script>
```

## Token Refresh (Automatic)

**v2.0+ automatically refreshes tokens** before expiration using the `getToken` callback. No manual handling required!

The SDK:
- Decodes token expiration from JWT `exp` claim
- Schedules automatic refresh 5 minutes before expiration (configurable)
- Fetches new token via `getToken` callback
- Reconnects with new token seamlessly
- Preserves all subscriptions across reconnection

### Optional: Listen for Refresh Events (UI Feedback)

```typescript
import { RelayRealtimeClient } from '@relay-sdk/sdk-browser';

const relay = new RelayRealtimeClient({
  getToken: async (taskIds) => {
    const response = await fetch('/api/relay/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds }),
    });
    return (await response.json()).token;
  },
  tokenExpirationWarningMs: 5 * 60 * 1000, // Refresh 5 min before expiration
});

// Optional: Listen for refresh events (for UI feedback only)
relay.on('TOKEN_EXPIRING', () => {
  console.log('Token refreshing automatically...');
  // Show toast: "Refreshing session..."
});

relay.on('CONNECTION_OPEN', () => {
  console.log('Token refreshed successfully');
  // Hide toast or show success message
});
```

**Note**: Token refresh is fully automatic. You only need to listen for events if you want to show UI feedback to users.

## Multiple Task Tracking

**v2.0+ automatically manages multi-task tokens.** Just call `listen()` for each task - the SDK handles the rest!

```typescript
// Frontend: Listen to multiple tasks
const relay = new RelayRealtimeClient({
  getToken: async (taskIds) => {
    // SDK automatically calls this with ALL task IDs when needed
    console.log('Fetching token for:', taskIds);
    // Example: taskIds = ['task-123', 'task-456', 'task-789']

    const response = await fetch('/api/relay/token', {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    });
    return (await response.json()).token;
  },
});

// Listen to multiple tasks - SDK automatically requests single token for all
await relay.listen('task-123');
await relay.listen('task-456');
await relay.listen('task-789');

console.log(relay.getListeningTo());  // ['task-123', 'task-456', 'task-789']

// Backend receives single request with all task IDs
// POST /api/relay/token
// { "taskIds": ["task-123", "task-456", "task-789"] }
```

**How it works:**
1. First `listen()` triggers connection → SDK calls `getToken(['task-123'])`
2. Second `listen()` detects new task → Reconnects with `getToken(['task-123', 'task-456'])`
3. Token refresh → SDK calls `getToken(['task-123', 'task-456', 'task-789'])` with all tracked tasks

The SDK ensures you always have a valid token scoped to all tasks you're listening to.

## Security Best Practices

1. **Always validate user access** before creating tokens
2. **Use short expiration times** (default 30 min is recommended)
3. **Scope tokens narrowly** - only grant access to resources the user needs
4. **Validate on your backend** - never trust client-side checks alone
5. **Use HTTPS** for your token endpoint
6. **Don't expose API keys** to the client - only session tokens

## Troubleshooting

### Token validation fails
- Verify your backend is using the correct API key
- Check that taskId exists in Relay and belongs to your developer account
- Ensure token hasn't expired

### WebSocket connection fails
- Verify token was successfully fetched from your backend
- Check browser console for connection errors
- Ensure WebSocket URL is correct (default: `wss://ws.sendrelay.com.ng`)

### Events not received
- Verify you are listening to the task: `await relay.listen(taskId)`
- Check that event listeners were registered before listening
- Ensure task is in the token scope

## API Reference

### `relay.auth.createWebSocketToken(request)`

Creates a scoped session token for WebSocket authentication.

**Parameters:**
- `request.scope` (string[]): Resources to grant access to (e.g., `['task:abc123']`)
- `request.expiresIn` (number, optional): Token lifetime in seconds (60-7200, default: 1800)

**Returns:**
- `token` (string): JWT token for WebSocket connection
- `expiresIn` (number): Token lifetime in seconds
- `expiresAt` (string): ISO 8601 expiration timestamp
- `scope` (string[]): Resources this token grants access to

**Throws:**
- `ValidationError`: Invalid scope or expiresIn
- `ApiError`: API request failed (e.g., task not found, unauthorized)

**Example:**
```typescript
const token = await relay.auth.createWebSocketToken({
  scope: ['task:abc123'],
  expiresIn: 1800,
});
// {
//   token: 'eyJhbGc...',
//   expiresIn: 1800,
//   expiresAt: '2024-12-28T12:30:00.000Z',
//   scope: ['task:abc123']
// }
```