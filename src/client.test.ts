import { describe, it, expect } from 'vitest';
import { RelayClient } from './client';
import { ValidationError } from './errors';

describe('RelayClient', () => {
	it('requires an API key', () => {
		expect(() => new RelayClient({ apiKey: '' })).toThrow(ValidationError);
	});

	it('validates API key prefix', () => {
		expect(() => new RelayClient({ apiKey: 'bad_key' })).toThrow(
			'Invalid API key format'
		);
	});

	it('detects live environment from API key', () => {
		const client = new RelayClient({ apiKey: 'sk_live_123' });
		expect(client.environment).toBe('live');
	});

	it('detects test environment from API key', () => {
		const client = new RelayClient({ apiKey: 'sk_test_123' });
		expect(client.environment).toBe('test');
	});

	it('uses sendrelay production base URL by default', () => {
		const client = new RelayClient({ apiKey: 'sk_test_123' }) as any;
		expect(client.http.options.baseUrl).toBe('https://api.sendrelay.com.ng');
	});
});
