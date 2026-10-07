declare global {
	namespace App {
		interface Locals {
			user: { id: string; name: string; county: string } | null;
		}
	}
}

export {};
