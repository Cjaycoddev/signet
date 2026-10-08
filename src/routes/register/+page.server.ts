import { fail, redirect } from '@sveltejs/kit';
import { bookJson, createCabinet, ready, saveBook } from '$lib/server/registry';
import type { Actions, PageServerLoad } from './$types';

const cookie = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: process.env.NODE_ENV === 'production',
	maxAge: 60 * 60 * 24 * 30
};

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(303, '/login');
	await ready(cookies.get('signet_added'));
	return { user: locals.user };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.user) throw redirect(303, '/login');
		await ready(cookies.get('signet_added'));
		const form = await request.formData();
		const values = {
			premises: String(form.get('premises') || ''),
			address: String(form.get('address') || ''),
			ward: String(form.get('ward') || ''),
			county: String(form.get('county') || 'Nairobi City'),
			operator: String(form.get('operator') || ''),
			model: String(form.get('model') || ''),
			serial: String(form.get('serial') || ''),
			status: String(form.get('status') || 'active') === 'suspended' ? 'suspended' as const : 'active' as const
		};
		const result = createCabinet(values);
		if ('error' in result) return fail(400, { message: result.error, ...values });
		await saveBook();
		cookies.set('signet_added', bookJson(), cookie);
		throw redirect(303, `/register/${result.machine.licence}`);
	}
};
