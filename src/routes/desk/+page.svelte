<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	let { data } = $props();

	function tone(status: string) {
		if (status === 'suspended') return 'bad';
		return 'good';
	}
</script>

<svelte:head>
	<title>Desk · Signet</title>
</svelte:head>

<main class="mx-auto min-h-screen max-w-5xl px-5 py-6 text-paper">
	<header class="flex items-center justify-between gap-3">
		<a href="/"><Wordmark light compact /></a>
		<div class="flex items-center gap-4">
			<Nav here="/desk" name={data.user.name} />
			<span class="hidden text-sm text-paper/70 md:inline">{data.user.name}</span>
			<form class="hidden md:block" method="POST" action="/logout"><button class="text-sm text-gold" type="submit">Sign out</button></form>
		</div>
	</header>

	<section class="mt-10 flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-xs font-semibold tracking-[0.18em] text-gold uppercase">{data.user.county}</p>
			<h1 class="display mt-3 text-6xl">{data.due.length} plates are due.</h1>
		</div>
		<a class="btn btn-ghost" href="/board">{data.total} in the book</a>
		<a class="btn btn-seal" href="/scan">Open the camera</a>
	</section>

	<div class="mt-8 grid gap-4 md:grid-cols-2">
		{#each data.due as machine}
			<article class="card text-ink p-5">
				<div class="flex items-start justify-between gap-3">
					<p class="plate text-sm">{machine.licence}</p>
					<span class="text-xs font-bold tracking-[0.14em] uppercase {tone(machine.status)}">{machine.status}</span>
				</div>
				<h2 class="display mt-4 text-4xl">{machine.premises}</h2>
				<p class="mt-1 text-sm text-mist">{machine.address}</p>
				<p class="mt-4 text-sm">{machine.primary.state === 'retired' ? 'Front tag retired. Scan the backup inside the door.' : 'Front tag is live, 8 cm, clear of the screen.'}</p>
				<a class="btn btn-ink mt-5" href={`/scan?expect=${machine.licence}`}>Scan this cabinet</a>
			</article>
		{/each}
	</div>

	{#if data.rest.length}
		<section class="mt-10">
			<h2 class="text-sm font-semibold tracking-[0.16em] text-paper/50 uppercase">Already seen</h2>
			<ul class="mt-3 space-y-2">
				{#each data.rest as machine}
					<li class="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm">
						<span>{machine.licence} · {machine.premises}</span>
						<span class="text-paper/50">{machine.lastInspection}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.scans.length}
		<section class="mt-8">
			<h2 class="text-sm font-semibold tracking-[0.16em] text-paper/50 uppercase">This sitting</h2>
			<ul class="mt-3 space-y-2 text-sm text-paper/80">
				{#each data.scans as scan}
					<li>{scan.licence} · {scan.role} · {scan.outcome} · {scan.verifier}</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
