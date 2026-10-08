import { ready, tagsForBoard } from '$lib/server/registry';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	await ready(cookies.get('signet_added'));
	return { tags: tagsForBoard(), user: locals.user };
};
