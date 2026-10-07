<script lang="ts">
	import Wordmark from '$lib/components/Wordmark.svelte';
	import Cabinet from '$lib/components/Cabinet.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>Signet</title>
</svelte:head>

<main class="mx-auto min-h-screen max-w-6xl px-5 py-6 text-paper">
	<header class="flex items-center justify-between">
		<Wordmark light />
		{#if data.user}
			<a class="btn btn-ghost" href="/desk">Open the desk</a>
		{:else}
			<a class="btn btn-ghost" href="/login">Verifier sign in</a>
		{/if}
	</header>

	<section class="mt-16 grid items-center gap-12 md:grid-cols-[1.15fr_0.85fr]">
		<div>
			<p class="text-xs font-semibold tracking-[0.22em] text-gold uppercase">County cabinet tag</p>
			<h1 class="display mt-4 text-6xl text-paper md:text-8xl">The plate is the proof.</h1>
			<p class="mt-6 max-w-xl text-lg text-paper/75">
				A verifier signs in, points a camera at the tag, and the register answers. The code is only a signed link. Names stay off the cabinet.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<a class="btn btn-seal" href={data.user ? '/scan' : '/login'}>Scan a tag</a>
				<a class="btn btn-ghost" href="/tags">Show the floor tags</a>
			</div>
		</div>
		<div class="card text-ink p-6">
			<Cabinet />
			<p class="mt-2 text-sm text-mist">Primary tag on the front panel. Hidden backup inside the locked door.</p>
		</div>
	</section>

	<p class="mt-16 text-sm text-paper/45">A prototype register. Not an official county system.</p>
</main>
