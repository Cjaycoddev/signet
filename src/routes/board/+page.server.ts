import { redirect } from '@sveltejs/kit';
import { listMachines, ready } from '$lib/server/registry';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(303, '/login');
	await ready(cookies.get('signet_added'));
	return { user: locals.user, machines: listMachines() };
};
