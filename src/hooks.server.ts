import { readSession } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = readSession(event.cookies.get('signet_session'));
	return resolve(event);
};
