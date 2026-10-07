import { redirect } from '@sveltejs/kit';
import { listMachines, listScans } from '$lib/server/registry';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const machines = listMachines();
	return {
		user: locals.user,
		due: machines.filter((machine) => machine.due),
		rest: machines.filter((machine) => !machine.due),
		scans: listScans()
	};
};
