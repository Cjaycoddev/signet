import { redirect } from '@sveltejs/kit';
import { bookJson, listMachines, listScans, ready } from '$lib/server/registry';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(303, '/login');
	await ready(cookies.get('signet_added'));
	cookies.set('signet_added', bookJson(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 30
	});
	const machines = listMachines();
	return {
		user: locals.user,
		due: machines.filter((machine) => machine.due),
		rest: machines.filter((machine) => !machine.due),
		scans: listScans(),
		total: machines.length
	};
};
