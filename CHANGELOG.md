# Changelog

## 1.9.0 — 2026-11-06

- Insurance on tasks: `insured: false` on `tasks.create` and `tasks.quote` turns it off for that task. It is on by default.
- `insuranceFee` and `insuredValue` on quote and create pricing. The premium is now its own line: VAT applies to it, and fare premiums and the platform fee no longer do.

## 1.8.0 — 2026-11-03

- Keep looking for a rider and scheduled pickups ([dispatch strategies](https://docs.sendrelay.com.ng/tasks/keep-looking-and-scheduling)).
- `dispatch` on `tasks.create` and `tasks.quote` (`DispatchRequest`: `IMMEDIATE`, `WAIT_FOR_RIDER` with `maxWaitMinutes`, `SCHEDULED` with `pickupAt`), and `task.dispatch` (`TaskDispatch`) with the search window. The `SCHEDULED` and `SEARCHING` statuses, the `task.status.searching`, `task.dispatch.started` and `task.dispatch.riders_nearby` webhook events, and the `SEARCH_THEN_ASSIGNED` and `SEARCH_EXPIRED` test outcomes are typed.
- `relay.tasks.simulateAdvance(taskId)` (test keys) starts a booking's search now.
- Task requests accept an optional `reference` on items, and optional `countryCode` (ISO 3166-1 alpha-2) and `postalCode` on stage locations. They are returned on the task when sent, and not used in pricing yet.
- Statuses and webhook event types this version doesn't list arrive as their raw strings; the `TaskStatus` and `WebhookEventType` types now say so. Relay will add task statuses (for example for tasks that keep searching for a rider), so treat a status you don't recognise as still in progress.

## 1.7.0 — 2026-10-29

- Sends its real version in `User-Agent` (it always said 1.0.0).
- Runs the shared SDK conformance suite.
- From this release the Relay server SDKs share one version.
