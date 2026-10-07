import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = 'signet-demo-seal';

export type Role = 'primary' | 'backup';
export type TagState = 'live' | 'retired';

export type Machine = {
	licence: string;
	premises: string;
	address: string;
	ward: string;
	county: string;
	operator: string;
	model: string;
	serial: string;
	status: 'active' | 'suspended';
	due: boolean;
	lastInspection: string;
	primary: { state: TagState; placement: string; size: string };
	backup: { state: TagState; placement: string; size: string };
};

export type ScanEvent = {
	at: string;
	verifier: string;
	licence: string;
	role: Role;
	outcome: string;
};

export type InspectResult = {
	ok: boolean;
	outcome: 'sealed' | 'backup' | 'retired' | 'suspended' | 'mismatch' | 'unknown' | 'forged';
	headline: string;
	detail: string;
	tag?: { role: Role; state: TagState; placement: string; size: string; payload: string };
	machine?: Machine;
	expected?: string | null;
};

const machines: Machine[] = [
	{
		licence: 'CG-2026-00731',
		premises: 'Riverside Social Club',
		address: 'Argwings Kodhek Road, Kilimani',
		ward: 'Kilimani',
		county: 'Nairobi City',
		operator: 'Riverside Amusements Ltd',
		model: 'Four-screen cabinet',
		serial: 'CAB-4419-K',
		status: 'active',
		due: true,
		lastInspection: '12 Sep 2026',
		primary: {
			state: 'live',
			placement: 'Flat front panel, away from any door seam and clear of the screen.',
			size: '8 cm square'
		},
		backup: {
			state: 'live',
			placement: 'Inside the locked door.',
			size: 'Hidden plate'
		}
	},
	{
		licence: 'CG-2026-00418',
		premises: 'South B Members Club',
		address: 'Mombasa Road slip, South B',
		ward: 'South B',
		county: 'Nairobi City',
		operator: 'South B Leisure Ltd',
		model: 'Upright cabinet',
		serial: 'CAB-2281-S',
		status: 'active',
		due: true,
		lastInspection: '2 Aug 2026',
		primary: {
			state: 'retired',
			placement: 'The front plate was peeled. This mark is no longer the live tag.',
			size: '8 cm square'
		},
		backup: {
			state: 'live',
			placement: 'Inside the locked door. This is the tag that still proves the cabinet.',
			size: 'Hidden plate'
		}
	},
	{
		licence: 'CG-2026-01102',
		premises: 'Eastleigh Hall',
		address: 'First Avenue, Eastleigh',
		ward: 'Eastleigh',
		county: 'Nairobi City',
		operator: 'Hall Two Ventures',
		model: 'Upright cabinet',
		serial: 'CAB-7704-E',
		status: 'suspended',
		due: true,
		lastInspection: '28 Sep 2026',
		primary: {
			state: 'live',
			placement: 'Flat front panel, clear of the screen.',
			size: '8 cm square'
		},
		backup: {
			state: 'live',
			placement: 'Inside the locked door.',
			size: 'Hidden plate'
		}
	},
	{
		licence: 'CG-2026-00890',
		premises: 'Karen Green Room',
		address: 'Karen Road',
		ward: 'Karen',
		county: 'Nairobi City',
		operator: 'Green Room Ltd',
		model: 'Four-screen cabinet',
		serial: 'CAB-9055-R',
		status: 'active',
		due: false,
		lastInspection: '1 Oct 2026',
		primary: {
			state: 'live',
			placement: 'Flat front panel, away from the door seam.',
			size: '8 cm square'
		},
		backup: {
			state: 'live',
			placement: 'Inside the locked door.',
			size: 'Hidden plate'
		}
	}
];

const scans: ScanEvent[] = [];

function mac(body: string) {
	return createHmac('sha256', SECRET).update(body).digest('hex').slice(0, 20);
}

export function tagPayload(licence: string, role: Role) {
	const body = `S1.${licence}.${role}`;
	return `${body}.${mac(body)}`;
}

export function listMachines() {
	return machines;
}

export function listScans() {
	return scans.slice(0, 8);
}

export function tagsForBoard() {
	return machines.flatMap((machine) =>
		(['primary', 'backup'] as Role[]).map((role) => ({
			licence: machine.licence,
			premises: machine.premises,
			role,
			state: machine[role].state,
			placement: machine[role].placement,
			payload: tagPayload(machine.licence, role)
		}))
	);
}

function same(a: string, b: string) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}

export function inspect(raw: string, verifier: string, expected?: string | null): InspectResult {
	const found = raw.toUpperCase().match(/S1\.([A-Z0-9-]+)\.(PRIMARY|BACKUP)\.([A-F0-9]{20})/);
	if (!found) {
		return {
			ok: false,
			outcome: 'unknown',
			headline: 'Not a Signet tag.',
			detail: 'The camera read something, but it is not a signed cabinet link.'
		};
	}
	const licence = found[1];
	const role = found[2].toLowerCase() as Role;
	const sig = found[3].toLowerCase();
	const body = `S1.${licence}.${role}`;
	if (!same(sig, mac(body))) {
		return {
			ok: false,
			outcome: 'forged',
			headline: 'The seal does not match.',
			detail: 'This pattern copies a Signet tag, but the signature is wrong. Do not treat the cabinet as licensed on this scan.'
		};
	}
	const machine = machines.find((item) => item.licence === licence);
	if (!machine) {
		return {
			ok: false,
			outcome: 'unknown',
			headline: 'Signed, but not on this register.',
			detail: `${licence} verifies as a Signet link, and this demo register has no cabinet under that plate.`
		};
	}
	const tag = machine[role];
	const payload = `${body}.${sig}`;
	scans.unshift({
		at: new Date().toISOString(),
		verifier,
		licence,
		role,
		outcome: tag.state === 'retired' ? 'retired' : machine.status === 'suspended' ? 'suspended' : role
	});

	if (expected && expected !== licence) {
		return {
			ok: false,
			outcome: 'mismatch',
			headline: 'Different cabinet.',
			detail: `You opened the run for ${expected}. This tag belongs to ${licence} at ${machine.premises}.`,
			tag: { role, state: tag.state, placement: tag.placement, size: tag.size, payload },
			machine,
			expected
		};
	}
	if (tag.state === 'retired') {
		return {
			ok: false,
			outcome: 'retired',
			headline: 'This tag was retired.',
			detail: `${role === 'primary' ? 'The front plate' : 'The backup'} on ${machine.premises} is no longer the live mark. Use the tag that is still live.`,
			tag: { role, state: tag.state, placement: tag.placement, size: tag.size, payload },
			machine
		};
	}
	if (machine.status === 'suspended') {
		return {
			ok: false,
			outcome: 'suspended',
			headline: 'Licence suspended.',
			detail: `${machine.licence} is on the cabinet and the seal is real. The register says this machine must not run.`,
			tag: { role, state: tag.state, placement: tag.placement, size: tag.size, payload },
			machine
		};
	}
	if (role === 'backup') {
		return {
			ok: true,
			outcome: 'backup',
			headline: 'Backup seal holds.',
			detail: 'You scanned the hidden tag inside the locked door. It names the same cabinet as the front plate, and it carries no personal data.',
			tag: { role, state: tag.state, placement: tag.placement, size: tag.size, payload },
			machine
		};
	}
	return {
		ok: true,
		outcome: 'sealed',
		headline: 'Front plate is genuine.',
		detail: 'The tag is the signed link. Premises, operator, and serial came from the register, not from the code.',
		tag: { role, state: tag.state, placement: tag.placement, size: tag.size, payload },
		machine
	};
}
