<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';

	let { data } = $props();
	let q = $state('');
	let status = $state('all');
	let visit = $state('all');
	let front = $state('all');
	let sort = $state('premises');

	const rows = $derived.by(() => {
		const query = q.trim().toLowerCase();
		const list = data.machines.filter((machine) => {
			if (status !== 'all' && machine.status !== status) return false;
			if (visit === 'due' && !machine.due) return false;
			if (visit === 'clear' && machine.due) return false;
			if (front !== 'all' && machine.primary.state !== front) return false;
			if (!query) return true;
			const hay = [machine.licence, machine.premises, machine.address, machine.ward, machine.operator, machine.serial, machine.model]
				.join(' ')
				.toLowerCase();
			return hay.includes(query);
		});
		const stamp = (value: string) => {
			const time = Date.parse(value);
			return Number.isNaN(time) ? 0 : time;
		};
		return list.sort((a, b) => {
			if (sort === 'licence') return a.licence.localeCompare(b.licence);
			if (sort === 'ward') return a.ward.localeCompare(b.ward);
			if (sort === 'visit') return stamp(b.lastInspection) - stamp(a.lastInspection);
			return a.premises.localeCompare(b.premises);
		});
	});
</script>

<svelte:head>
	<title>Cabinets · Signet</title>
</svelte:head>

<main class="mx-auto min-h-screen max-w-6xl px-5 py-6 text-paper">
	<header class="flex flex-wrap items-center justify-between gap-3">
		<a href="/"><Wordmark light compact /></a>
		<div class="flex items-center gap-4">
			<Nav here="/board" name={data.user.name} />
			<form class="hidden md:block" method="POST" action="/logout"><button class="text-sm text-gold" type="submit">Sign out</button></form>
		</div>
	</header>

	<section class="mt-8 flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-xs font-semibold tracking-[0.18em] text-gold uppercase">The book</p>
			<h1 class="display mt-2 text-6xl">{rows.length} of {data.machines.length}</h1>
		</div>
		<a class="btn btn-seal" href="/register">Register a cabinet</a>
	</section>

	<section class="card text-ink mt-6 p-4 md:p-5">
		<div class="grid gap-3 md:grid-cols-[1.4fr_repeat(4,minmax(0,0.7fr))]">
			<label class="block">
				<span class="text-xs font-semibold tracking-[0.12em] text-mist uppercase">Search</span>
				<input class="field mt-1" bind:value={q} placeholder="Licence, club, ward, serial…" />
			</label>
			<label class="block">
				<span class="text-xs font-semibold tracking-[0.12em] text-mist uppercase">Licence</span>
				<select class="field mt-1" bind:value={status}>
					<option value="all">All</option>
					<option value="active">Active</option>
					<option value="suspended">Suspended</option>
				</select>
			</label>
			<label class="block">
				<span class="text-xs font-semibold tracking-[0.12em] text-mist uppercase">Visit</span>
				<select class="field mt-1" bind:value={visit}>
					<option value="all">All</option>
					<option value="due">Due</option>
					<option value="clear">Already seen</option>
				</select>
			</label>
			<label class="block">
				<span class="text-xs font-semibold tracking-[0.12em] text-mist uppercase">Front tag</span>
				<select class="field mt-1" bind:value={front}>
					<option value="all">All</option>
					<option value="live">Live</option>
					<option value="retired">Retired</option>
				</select>
			</label>
			<label class="block">
				<span class="text-xs font-semibold tracking-[0.12em] text-mist uppercase">Sort</span>
				<select class="field mt-1" bind:value={sort}>
					<option value="premises">Premises</option>
					<option value="licence">Licence</option>
					<option value="ward">Ward</option>
					<option value="visit">Last visit</option>
				</select>
			</label>
		</div>

		{#if rows.length === 0}
			<p class="mt-8 text-mist">Nothing in the book matches that.</p>
		{:else}
			<div class="mt-5 hidden overflow-hidden rounded-2xl border border-line md:block">
				<table class="w-full text-left text-sm">
					<thead class="bg-paper text-xs tracking-[0.12em] text-mist uppercase">
						<tr>
							<th class="px-4 py-3 font-semibold">Licence</th>
							<th class="px-4 py-3 font-semibold">Premises</th>
							<th class="px-4 py-3 font-semibold">Ward</th>
							<th class="px-4 py-3 font-semibold">Operator</th>
							<th class="px-4 py-3 font-semibold">Front</th>
							<th class="px-4 py-3 font-semibold">State</th>
							<th class="px-4 py-3 font-semibold"></th>
						</tr>
					</thead>
					<tbody>
						{#each rows as machine}
							<tr class="border-t border-line">
								<td class="plate px-4 py-3">{machine.licence}</td>
								<td class="px-4 py-3">
									<span class="block font-semibold">{machine.premises}</span>
									<span class="text-mist">{machine.serial} · {machine.model}</span>
								</td>
								<td class="px-4 py-3">{machine.ward}</td>
								<td class="px-4 py-3">{machine.operator}</td>
								<td class="px-4 py-3 capitalize">{machine.primary.state}</td>
								<td class="px-4 py-3 capitalize {machine.status === 'suspended' ? 'text-wax' : 'text-moss'}">{machine.status}</td>
								<td class="px-4 py-3 text-right"><a class="font-semibold text-wax" href={`/scan?expect=${machine.licence}`}>Scan</a></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<ul class="mt-4 space-y-3 md:hidden">
				{#each rows as machine}
					<li class="rounded-2xl border border-line p-4">
						<p class="plate text-xs">{machine.licence}</p>
						<p class="display mt-1 text-3xl">{machine.premises}</p>
						<p class="text-sm text-mist">{machine.ward} · {machine.operator}</p>
						<p class="mt-2 text-sm capitalize">{machine.primary.state} front tag · {machine.status}</p>
						<a class="mt-3 inline-block text-sm font-semibold text-wax" href={`/scan?expect=${machine.licence}`}>Scan this cabinet</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
