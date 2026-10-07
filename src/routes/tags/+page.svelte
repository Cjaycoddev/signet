<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
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
	<title>Floor tags · Signet</title>
</svelte:head>

<main class="mx-auto min-h-screen max-w-5xl px-5 py-6 text-paper">
	<header class="flex items-center justify-between">
		<a href="/"><Wordmark light compact /></a>
		<a class="btn btn-seal" href="/scan">Scan with the camera</a>
	</header>
	<h1 class="display mt-10 text-6xl">Hold a phone over one of these.</h1>
	<p class="mt-3 max-w-xl text-paper/70">
		These are the live codes. The drawing in the brief was only an illustration. Each pattern below is a signed link, and it carries no personal data.
	</p>

	<div class="mt-8 grid gap-4 sm:grid-cols-2">
		{#each data.tags as tag}
			<article class="rounded-[28px] bg-foam p-5 text-ink" data-payload={tag.payload}>
				<p class="text-xs font-semibold tracking-[0.16em] text-wax uppercase">County gaming machine tag</p>
				<div class="mt-4 grid min-h-52 place-items-center rounded-2xl bg-white">
					{#if images[tag.payload]}
						<img alt="Signed tag for {tag.licence}" src={images[tag.payload]} class="h-52 w-52" />
					{:else}
						<p class="text-sm text-mist">Drawing the seal…</p>
					{/if}
				</div>
				<div class="mt-4 flex items-end justify-between gap-3">
					<div>
						<p class="plate text-sm">{tag.licence}</p>
						<p class="mt-1 font-semibold">{tag.premises}</p>
						<p class="text-sm text-mist">{tag.role === 'primary' ? 'Front panel, 8 cm' : 'Inside the locked door'}</p>
					</div>
					<p class="max-w-28 text-right text-xs text-mist">Signed link only. No personal data.</p>
				</div>
				{#if tag.state === 'retired'}
					<p class="mt-3 text-sm text-wax">Retired mark. A real scan should refuse it.</p>
				{/if}
			</article>
		{/each}
	</div>
</main>
