# Changelog

## 1.15.0 — 2026-11-16

- Errands with work stages: `taskType: 'ERRAND'` takes the stage types `PURCHASE`, `PAYMENT`, `QUEUE`, `INSPECTION` and `CUSTOM` beside `PICKUP` and `DROPOFF`, with their fields on `Stage` (`WorkStageFields`: `reference`, `expectedMinutes`, `maxMinutes`, `openingHours`, shopping-list `items`, `spendLimit`, `payWith`, `payee`, `amount`, `questions`, `effort`, and `simulate` for test keys). The `Errand` builders (`Errand.queue`, `Errand.purchase`, `Errand.payment`, `Errand.inspection`, `Errand.custom`, `Errand.pickup`, `Errand.dropoff`) write the same JSON. See [errands](https://docs.sendrelay.com.ng/errands).
- `priceLimit` and `approvals` on create and quote. An errand quote returns `pricing` (`ErrandQuotePricing`, a range), `schedule`, `warnings` and `stages`; create returns `errand`, `schedule`, `warnings` and `approvals`. Tasks carry `errand` (`ErrandSummary`), and stages `result`, `reason`, `approval` and `plannedArrivalAt`; stage statuses add `FAILED` and `SKIPPED`.
- `relay.errands.options()`, `relay.tasks.approvals(taskId)`, `relay.tasks.decideApproval(taskId, approvalId, { decision, note })`, `relay.tasks.skipStage(taskId, stageIndex)` and `relay.tasks.viewFile(taskId, fileUrl)`. `relay.tasks.update()` also changes an errand stop's `items` or `questions`, and `trackingLink()` takes `canAnswer`.
- Other task types are unchanged.

## 1.14.0 — 2026-11-15

- `relay.tasks.getByExternalId(externalId)`: the task with the `externalId` you gave it at create, as `get` returns it, or `null` if none has it (`GET /v1/sdk/tasks/by-external-id/{externalId}`). The reference is percent-encoded, so it can hold a slash.

## 1.13.0 — 2026-11-15

- Pooled delivery: `taskType: 'POOLED_DELIVERY'` and `window` (`PooledWindowRequest`) on `relay.tasks.create()` and `relay.tasks.quote()`. A quote without a window returns `windows` (`PooledQuoteWindow[]`): each upcoming wave with its status, times, price range and `quoteId`. Pooled tasks carry `window` (`TaskPooledWindow`: wave, times, `state`, `sharedWith`, planned times, `stopsBefore`) and pricing gains `kind: 'RANGE'`, `maxTotal`, `minTotal`, `finalTotal` and `finalAt`. Other task types are unchanged. See [pooled delivery](https://docs.sendrelay.com.ng/concepts/pooled-delivery).
- `simulationOutcome: 'POOLING_SOLO'` for test pooled deliveries, and the `task.pooling.grouped` and `task.pooling.solo` webhook events.
- `BULK_DELIVERY` is marked deprecated: create and quote now refuse it with `TASK_TYPE_RENAMED`. Older tasks keep it.

## 1.12.0 — 2026-11-14

- `VehicleType` no longer includes `BIKE`; use `MOTORCYCLE`. The API now rejects `BIKE` with a 400, and the presence map no longer returns a `BIKE` count. See the [changelog](https://docs.sendrelay.com.ng/changelog).

## 1.11.0 — 2026-11-09

- `requirements` on `Task` and `TaskQuoteResponse` (`TaskRequirements`, `RiderEquipment`): each vehicle SendRelay looks for and the equipment a rider on it needs, for example a box on a motorcycle for food. See [the box a task needs](https://docs.sendrelay.com.ng/concepts/dispatch#the-box-a-task-needs).
- `relay.presence.get()` takes a job: `taskType`, `vehicleType` (an array, sent as a comma-separated list), `hasBox`, `hasRefrigeration`, `hasAirConditioning`, `estimatedWeight` and `estimatedSize`, with the quote's meanings. It then counts only riders who could take that job and returns `requirements`. Without `taskType` the map is unchanged.

## 1.10.0 — 2026-11-08

- `relay.events.list()` and `relay.events.listAll()`: the event log, every event for your account and mode, kept for 30 days. `types` filters by event type.
- `relay.tasks.events(taskId)`: every event about one task, oldest first.
- `relay.claims`: insurance claims on a task, for insured goods lost, stolen or damaged after collection. `get`, `createUpload` (a URL to PUT one photo or PDF to), `file`, `respond` and `withdraw`. Live keys only.
- `relay.webhooks.redeliver(webhookId, { eventId })`: send a logged event to an endpoint again, with the same id.
- `updatedSince` on `relay.tasks.list()` and `listAll()`: tasks changed since a time, in `updatedAt` order, for reconciliation jobs.
- `revision` and `currency` on `Task` and `TaskListItem`. Task events carry `data.revision`: apply an event only if it is higher than the revision you stored.
- `relay.tasks.update(taskId, request)` edits notes, externalId, and a stop's instructions and contact; `relay.tasks.trackingLink(taskId, request?)` returns a hosted tracking page.
- Stops accept `contact`, `deliverItems` and `completionCode`, and return `arrivedAt`, `waitSeconds` and `completionCodeLength`. `requirePhoto` on create. `dispatch.readyAt` and `dispatch.onRiderCancel`, and the `RIDER_CANCELS_THEN_REASSIGNED` test outcome. Webhook types `task.stage.arrived`, `task.details.updated` and `task.dispatch.rider_unassigned`.

## 1.9.0 — 2026-11-06

- Insurance on tasks: `insured: false` on `tasks.create` and `tasks.quote` turns it off for that task. It is on by default.
- `insuranceFee` and `insuredValue` on quote and create pricing. The premium is now its own line: VAT applies to it, and fare premiums and the platform fee no longer do.

## 1.8.0 — 2026-11-03

- Keep looking for a rider and scheduled pickups ([dispatch strategies](https://docs.sendrelay.com.ng/tasks/keep-looking-and-scheduling)).
- `dispatch` on `tasks.create` and `tasks.quote` (`DispatchRequest`: `IMMEDIATE`, `WAIT_FOR_RIDER` with `maxWaitMinutes`, `SCHEDULED` with `pickupAt`), and `task.dispatch` (`TaskDispatch`) with the search window. The `SCHEDULED` and `SEARCHING` statuses, the `task.status.searching`, `task.dispatch.started` and `task.dispatch.riders_nearby` webhook events, and the `SEARCH_THEN_ASSIGNED` and `SEARCH_EXPIRED` test outcomes are typed.
- `relay.tasks.simulateAdvance(taskId)` (test keys) starts a booking's search now.
- Task requests accept an optional `reference` on items, and optional `countryCode` (ISO 3166-1 alpha-2) and `postalCode` on stage locations. They are returned on the task when sent, and not used in pricing yet.
- Statuses and webhook event types this version doesn't list arrive as their raw strings; the `TaskStatus` and `WebhookEventType` types now say so. SendRelay will add task statuses (for example for tasks that keep searching for a rider), so treat a status you don't recognise as still in progress.

## 1.7.0 — 2026-10-29

- Sends its real version in `User-Agent` (it always said 1.0.0).
- Runs the shared SDK conformance suite.
- From this release the SendRelay server SDKs share one version.
