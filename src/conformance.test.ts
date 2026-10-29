/**
 * Runs the shared SDK conformance fixtures (packages/sdks/conformance) against this SDK.
 * Every Relay SDK runs the same fixtures, which is how they stay at parity.
 */
import * as fs from 'fs';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RelayClient } from './client';
import { ApiError, NetworkError, ValidationError } from './errors';

const dir = process.env.RELAY_CONFORMANCE_DIR ?? path.resolve(__dirname, '../../conformance');
const available = fs.existsSync(path.join(dir, 'manifest.json'));
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));

type Exchange = {
  request: { method: string; path: string; query: Record<string, string>; body: unknown; headers: Record<string, string> };
  response: { status: number; body: unknown };
};
type Fixture = {
  name: string;
  operation: string;
  input: { taskId?: string; webhookId?: string; body?: any; query?: any; idempotencyKey?: string };
  exchanges: Exchange[];
  expect: { result?: Record<string, unknown>; items?: string[]; error?: Record<string, unknown> };
};

type Binding = (relay: RelayClient, input: Fixture['input']) => Promise<unknown>;

const bindings: Record<string, Binding> = {
  'tasks.quote': (r, i) => r.tasks.quote(i.body),
  'tasks.create': (r, i) => r.tasks.create(i.body, i.idempotencyKey ? { idempotencyKey: i.idempotencyKey } : undefined),
  'tasks.list': (r, i) => r.tasks.list(i.query),
  'tasks.listAll': async (r, i) => {
    const ids: string[] = [];
    for await (const task of r.tasks.listAll(i.query)) ids.push(task.id);
    return ids;
  },
  'tasks.get': (r, i) => r.tasks.get(i.taskId!),
  'tasks.cancel': (r, i) => r.tasks.cancel(i.taskId!, i.body),
  'tasks.assign': (r, i) => r.tasks.assign(i.taskId!, i.body),
  'tasks.availableRiders': (r, i) => r.tasks.availableRiders(i.taskId!, i.query),
  'tasks.rate': (r, i) => r.tasks.rate(i.taskId!, i.body),
  'tasks.dispute': (r, i) => r.tasks.dispute(i.taskId!, i.body),
  'webhooks.create': (r, i) => r.webhooks.create(i.body),
  'webhooks.list': (r) => r.webhooks.list(),
  'webhooks.get': (r, i) => r.webhooks.get(i.webhookId!),
  'webhooks.update': (r, i) => r.webhooks.update(i.webhookId!, i.body),
  'webhooks.delete': (r, i) => r.webhooks.delete(i.webhookId!),
  'auth.createWebSocketToken': (r, i) => r.auth.createWebSocketToken(i.body),
  'presence.get': (r, i) => r.presence.get(i.query),
};
// Operations checked by a dedicated fixture file rather than an HTTP exchange.
const localOperations = new Set(['webhooks.verifySignature']);

function lookup(value: unknown, dotted: string): unknown {
  return dotted.split('.').reduce<any>((node, key) => (node == null ? undefined : node[key]), value);
}

function expectPaths(actual: unknown, expected: Record<string, unknown>) {
  for (const [key, want] of Object.entries(expected)) {
    const got = lookup(actual, key);
    if (want === null) expect(got ?? null, key).toBeNull();
    else expect(got, key).toEqual(want);
  }
}

function walk(sub: string): Fixture[] {
  const root = path.join(dir, sub);
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(path.join(sub, entry.name))
      : entry.name.endsWith('.json')
        ? [read(path.join(sub, entry.name)) as Fixture]
        : [],
  );
}

function mockExchanges(exchanges: Exchange[], commonHeaders: Record<string, string>) {
  const queue = [...exchanges];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    const next = queue.shift();
    if (!next) throw new Error(`Unexpected request: ${init.method} ${url}`);
    const parsed = new URL(url);
    const headers = init.headers as Record<string, string>;
    expect(init.method).toBe(next.request.method);
    expect(parsed.pathname).toBe(next.request.path);
    expect(Object.fromEntries(parsed.searchParams)).toEqual(next.request.query);
    expect(init.body === undefined ? null : JSON.parse(init.body as string)).toEqual(next.request.body);
    for (const [name, want] of Object.entries({ ...commonHeaders, ...next.request.headers })) {
      if (want === '<absent>') expect(headers[name], name).toBeUndefined();
      else if (want === '<any>') expect(headers[name], name).toBeTruthy();
      else expect(headers[name], name).toBe(want);
    }
    return new Response(JSON.stringify(next.response.body), { status: next.response.status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, remaining: () => queue.length };
}

describe.skipIf(!available)('conformance', () => {
  if (!available) return;
  const manifest = read('manifest.json');
  const client = read('client.json');
  const fixtures = walk('http');
  const { apiKey, baseUrl, commonHeaders } = manifest.server;

  afterEach(() => vi.unstubAllGlobals());

  it('binds every operation in the manifest, each with at least one fixture', () => {
    for (const op of manifest.server.operations) {
      if (op.local || localOperations.has(op.id)) continue;
      expect(bindings[op.id], `missing binding for ${op.id}`).toBeTypeOf('function');
      expect(fixtures.some((f) => f.operation === op.id), `no fixture for ${op.id}`).toBe(true);
    }
  });

  describe('http', () => {
    for (const fixture of fixtures) {
      it(`${fixture.operation}: ${fixture.name}`, async () => {
        const relay = new RelayClient({ apiKey, baseUrl, retry: { enabled: false } });
        const { fetchMock, remaining } = mockExchanges(fixture.exchanges, commonHeaders);
        const run = bindings[fixture.operation]!(relay, fixture.input);

        if (fixture.expect.error) {
          const error: any = await run.then(
            () => undefined,
            (err) => err,
          );
          const { type, ...fields } = fixture.expect.error;
          expect(error?.name, 'error type').toBe(type);
          expectPaths(error, fields);
        } else {
          const result = JSON.parse(JSON.stringify(await run));
          if (fixture.expect.items) expect(result).toEqual(fixture.expect.items);
          if (fixture.expect.result) expectPaths(result, fixture.expect.result);
        }
        expect(remaining(), 'unanswered exchanges').toBe(0);
        expect(fetchMock).toHaveBeenCalledTimes(fixture.exchanges.length);
      });
    }
  });

  describe('client', () => {
    it('uses the shared defaults', () => {
      const relay = new RelayClient({ apiKey: 'sk_test_abc' });
      const http = (relay as any).http.options;
      const d = client.defaults;
      expect(http.baseUrl).toBe(d.baseUrl);
      expect(http.apiVersion).toBe(d.apiVersion);
      expect(http.timeout).toBe(d.timeoutMs);
      expect(http.retry.maxRetries).toBe(d.retry.maxRetries);
      expect(http.retry.initialDelayMs).toBe(d.retry.initialDelayMs);
      expect(http.retry.maxDelayMs).toBe(d.retry.maxDelayMs);
      expect(http.retry.backoffMultiplier).toBe(d.retry.backoffMultiplier);
      expect(http.retry.retryableStatusCodes).toEqual(d.retry.retryableStatusCodes);
      expect(http.idempotency.autoGenerate).toBe(d.idempotency.autoGenerate);
    });

    for (const c of client.apiKeys) {
      it(`api key ${JSON.stringify(c.apiKey)}`, () => {
        if (c.error) expect(() => new RelayClient({ apiKey: c.apiKey })).toThrow(ValidationError);
        else expect(new RelayClient({ apiKey: c.apiKey }).environment).toBe(c.environment);
      });
    }

    for (const c of client.errors.cases) {
      it(`errors: ${c.name}`, async () => {
        const relay = new RelayClient({
          apiKey,
          baseUrl,
          retry: { maxRetries: 1, initialDelayMs: 0, maxDelayMs: 0 },
        });
        const fetchMock = vi.fn(async () => {
          if (c.networkFailure) throw new TypeError('fetch failed');
          return new Response(c.rawBody ?? JSON.stringify(c.body), { status: c.status });
        });
        vi.stubGlobal('fetch', fetchMock);

        const error: any = await relay.tasks.get('t_1').then(
          () => undefined,
          (err) => err,
        );
        const { type, ...fields } = c.expect;
        expect(error).toBeInstanceOf(type === 'NetworkError' ? NetworkError : ApiError);
        expectPaths(error, fields);
        expect(fetchMock).toHaveBeenCalledTimes(c.attempts);
      });
    }
  });

  describe('webhook signatures', () => {
    const relay = new RelayClient({ apiKey: 'sk_test_abc' });
    for (const c of read('webhooks/signatures.json').cases) {
      it(c.name, () => {
        const result = relay.webhooks.verifySignature(c.payload, c.header, c.secret, c.tolerance);
        expect(result.valid).toBe(c.valid);
        if (!c.valid) expect(result.error).toBe(c.error);
      });
    }
  });
});
