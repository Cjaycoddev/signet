import { inspect, ready } from '$lib/server/registry';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	if (!locals.user) {
		return json(
			{ ok: false, outcome: 'unknown', headline: 'Sign in first.', detail: 'A verifier session is required.' },
			{ status: 401 }
		);
	}
	await ready(cookies.get('signet_added'));
	const body = (await request.json()) as { code?: string; expected?: string };
	const result = inspect(String(body.code || ''), locals.user.name, body.expected || null);
	return json(result);
};
