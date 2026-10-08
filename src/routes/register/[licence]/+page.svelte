<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import Nav from '$lib/components/Nav.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';

	let { data } = $props();
	let images = $state<Record<string, string>>({});

	onMount(async () => {
		const next: Record<string, string> = {};
		for (const tag of data.tags) {
			next[tag.payload] = await QRCode.toDataURL(tag.payload, {
				margin: 1,
				width: 320,
				color: { dark: '#16130f', light: '#fffaf300' }
			});
		}
		images = next;
	});
</script>

<svelte:head>
	<title>{data.machine.licence} · Signet</title>
</svelte:head>

<main class="mx-auto min-h-screen max-w-4xl px-5 py-6 text-paper">
	<header class="flex flex-wrap items-center justify-between gap-3">
		<a href="/"><Wordmark light compact /></a>
		<Nav here="/register" name={data.user.name} />
	</header>
	<p class="mt-10 text-xs font-semibold tracking-[0.18em] text-gold uppercase">Plate cut</p>
	<h1 class="display mt-2 text-6xl">{data.machine.licence}</h1>
	<p class="mt-3 text-paper/75">{data.machine.premises} · {data.machine.address}. Stick the front tag clear of the screen. The second tag goes inside the locked door.</p>

	<div class="mt-8 grid gap-4 sm:grid-cols-2">
		{#each data.tags as tag}
			<article class="rounded-[28px] bg-foam p-5 text-ink">
				<p class="text-xs font-semibold tracking-[0.16em] text-wax uppercase">County gaming machine tag</p>
				<div class="mt-4 grid min-h-52 place-items-center rounded-2xl bg-white">
					{#if images[tag.payload]}
						<img alt="{tag.role} tag for {data.machine.licence}" src={images[tag.payload]} class="h-52 w-52" />
					{:else}
						<p class="text-sm text-mist">Drawing the seal…</p>
					{/if}
				</div>
				<p class="plate mt-4 text-sm">{data.machine.licence}</p>
				<p class="font-semibold">{tag.label}</p>
				<p class="text-sm text-mist">Signed link only. No personal data.</p>
			</article>
		{/each}
	</div>
	<div class="mt-6 flex flex-wrap gap-3">
		<a class="btn btn-seal" href={`/scan?expect=${data.machine.licence}`}>Scan this cabinet</a>
		<a class="btn btn-ghost" href="/board">Back to the book</a>
	</div>
</main>
