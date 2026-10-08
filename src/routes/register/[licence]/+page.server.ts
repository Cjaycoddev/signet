import { error, redirect } from '@sveltejs/kit';
import { listMachines, ready, tagPayload } from '$lib/server/registry';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
	if (!locals.user) throw redirect(303, '/login');
	await ready(cookies.get('signet_added'));
	const machine = listMachines().find((item) => item.licence === params.licence);
	if (!machine) error(404, 'That plate is not in the book.');
	return {
		user: locals.user,
		machine,
		tags: [
			{ role: 'primary', label: 'Front panel, 8 cm', payload: tagPayload(machine.licence, 'primary') },
			{ role: 'backup', label: 'Inside the locked door', payload: tagPayload(machine.licence, 'backup') }
		]
	};
};
