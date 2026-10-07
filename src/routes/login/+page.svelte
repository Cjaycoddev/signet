<script lang="ts">
	import Wordmark from '$lib/components/Wordmark.svelte';
	let { data, form } = $props();
</script>

<svelte:head>
	<title>Sign in · Signet</title>
</svelte:head>

<main class="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-5 py-8 md:grid-cols-2">
	<section class="text-paper">
		<Wordmark light />
		<h1 class="display mt-10 text-6xl">Walk in as the verifier.</h1>
		<p class="mt-4 max-w-sm text-paper/70">Demo password for both desks: <span class="text-gold">signet</span>.</p>
	</section>
	<section class="card text-ink space-y-6 p-6">
		{#if form?.message}
			<p class="rounded-2xl bg-[#fde4de] px-4 py-3 text-wax">{form.message}</p>
		{/if}
		<div>
			<p class="text-xs font-semibold tracking-[0.16em] text-wax uppercase">Demo desks</p>
			<div class="mt-3 grid gap-2">
				{#each data.people as person}
					<form method="POST" action="?/demo">
						<input type="hidden" name="email" value={person.email} />
						<button class="desk flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-left" type="submit">
							<span>
								<span class="block font-semibold">{person.name}</span>
								<span class="text-sm text-mist">{person.county} verifier</span>
							</span>
							<span class="text-sm font-semibold text-wax">Enter</span>
						</button>
					</form>
				{/each}
			</div>
		</div>
		<form method="POST" action="?/login" class="space-y-3 border-t border-line pt-5">
			<label class="block text-sm font-semibold" for="email">Email</label>
			<input class="field" id="email" name="email" type="email" autocomplete="username" required />
			<label class="block text-sm font-semibold" for="password">Password</label>
			<input class="field" id="password" name="password" type="password" autocomplete="current-password" required />
			<button class="btn btn-ink w-full" type="submit">Sign in</button>
		</form>
	</section>
</main>
