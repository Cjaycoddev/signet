import { json } from '@sveltejs/kit';
import { listMachines, ready } from '$lib/server/registry';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (!locals.user) return json({ cabinets: [] }, { status: 401 });
	await ready(cookies.get('signet_added'));
	const cabinets = listMachines().map((machine) => ({
		licence: machine.licence,
		premises: machine.premises,
		ward: machine.ward,
		serial: machine.serial,
		status: machine.status,
		due: machine.due,
		front: machine.primary.state
	}));
	return json({ cabinets });
};
