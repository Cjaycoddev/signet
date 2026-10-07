import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

const COOKIE = 'signet_session';
const SECRET = 'signet-session-demo';

export type Verifier = { id: string; name: string; county: string; email: string };

const people: Verifier[] = [
	{ id: 'asha', name: 'Asha Okello', county: 'Nairobi City', email: 'asha@signet.test' },
	{ id: 'leo', name: 'Leo Mwangi', county: 'Nairobi City', email: 'leo@signet.test' }
];

const PASSWORD = 'signet';

export function verifiers() {
	return people;
}

export function checkLogin(email: string, password: string) {
	const person = people.find((item) => item.email === email.trim().toLowerCase());
	if (!person || password !== PASSWORD) return null;
	return person;
}

function sign(id: string) {
	return createHmac('sha256', SECRET).update(id).digest('hex').slice(0, 24);
}

export function setSession(cookies: Cookies, id: string) {
	const token = `${id}.${sign(id)}.${randomBytes(8).toString('hex')}`;
	cookies.set(COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 12 });
}

export function clearSession(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/' });
}

export function readSession(token: string | undefined): Verifier | null {
	if (!token) return null;
	const [id, sig] = token.split('.');
	if (!id || !sig) return null;
	const expected = sign(id);
	const left = Buffer.from(sig);
	const right = Buffer.from(expected);
	if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
	return people.find((item) => item.id === id) ?? null;
}
