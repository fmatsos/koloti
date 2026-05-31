import { beforeEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockClient: any;

vi.mock('$lib/server/supabase', () => ({
	createServiceClient: () => mockClient
}));

vi.mock('$lib/server/audit', () => ({
	writeAuditLog: vi.fn(async () => {})
}));

import { actions } from '../routes/(app)/assemblees-generales/[id]/+page.server';

function buildMockClient(currentStatus: string, updateError: unknown = null) {
	const updates: Array<Record<string, unknown>> = [];

	const assemblyBuilder = {
		select: vi.fn(() => assemblyBuilder),
		update: vi.fn((payload: Record<string, unknown>) => {
			updates.push(payload);
			return { eq: vi.fn(async () => ({ error: updateError })) };
		}),
		eq: vi.fn(() => assemblyBuilder),
		single: vi.fn(async () => ({ data: { status: currentStatus }, error: null }))
	};

	return {
		client: { from: vi.fn(() => assemblyBuilder) },
		updates
	};
}

function buildLocals(role: string | null) {
	return {
		profile: role ? { id: 'profile-uuid', role } : null,
		session: null
	};
}

function buildParams(id = 'ag-uuid') {
	return { id };
}

beforeEach(() => {
	vi.clearAllMocks();
	mockClient = buildMockClient('open').client;
});

describe('actions.close', () => {
	it('retourne 403 si non connecté', async () => {
		const { client } = buildMockClient('open');
		mockClient = client;
		const result = await actions.close({
			locals: buildLocals(null),
			params: buildParams(),
			request: new Request('http://localhost')
		} as never);
		expect(result).toMatchObject({ status: 403 });
	});

	it('retourne 403 si rôle editor', async () => {
		const { client } = buildMockClient('open');
		mockClient = client;
		const result = await actions.close({
			locals: buildLocals('editor'),
			params: buildParams(),
			request: new Request('http://localhost')
		} as never);
		expect(result).toMatchObject({ status: 403 });
	});

	it('retourne 400 si statut !== open', async () => {
		const { client } = buildMockClient('convened');
		mockClient = client;
		const result = await actions.close({
			locals: buildLocals('admin'),
			params: buildParams(),
			request: new Request('http://localhost')
		} as never);
		expect(result).toMatchObject({ status: 400 });
	});

	it('retourne {success: true} si admin + statut open', async () => {
		const { client } = buildMockClient('open');
		mockClient = client;
		const result = await actions.close({
			locals: buildLocals('admin'),
			params: buildParams(),
			request: new Request('http://localhost')
		} as never);
		expect(result).toMatchObject({ success: true });
	});

	it('met à jour status=closed et closed_at dans la DB si admin + statut open', async () => {
		const { client, updates } = buildMockClient('open');
		mockClient = client;
		await actions.close({
			locals: buildLocals('admin'),
			params: buildParams(),
			request: new Request('http://localhost')
		} as never);
		expect(updates[0]).toMatchObject({ status: 'closed' });
		expect(typeof updates[0].closed_at).toBe('string');
	});

	it('retourne 400 si la mise à jour DB échoue', async () => {
		const { client } = buildMockClient('open', { message: 'DB error' });
		mockClient = client;
		const result = await actions.close({
			locals: buildLocals('admin'),
			params: buildParams(),
			request: new Request('http://localhost')
		} as never);
		expect(result).toMatchObject({ status: 400 });
	});
});
