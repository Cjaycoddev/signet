import { fail, redirect } from '@sveltejs/kit';
import { checkLogin, setSession, verifiers } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/desk');
	return { people: verifiers().map((person) => ({ name: person.name, county: person.county, email: person.email })) };
};

export const actions: Actions = {
	demo: async ({ request, cookies }) => {
		const form = await request.formData();
		const person = checkLogin(String(form.get('email') || ''), 'signet');
		if (!person) return fail(400, { message: 'That desk is not on the demo.' });
		setSession(cookies, person.id);
		throw redirect(303, '/desk');
	},
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const person = checkLogin(String(form.get('email') || ''), String(form.get('password') || ''));
		if (!person) return fail(400, { message: 'Email or password did not match. The demo password is signet.' });
		setSession(cookies, person.id);
		throw redirect(303, '/desk');
	}
};
