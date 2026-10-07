import { tagsForBoard } from '$lib/server/registry';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { tags: tagsForBoard() };
};
