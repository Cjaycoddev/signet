<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	let { data, form } = $props();
</script>

<svelte:head>
	<title>New cabinet · Signet</title>
</svelte:head>

<main class="mx-auto min-h-screen max-w-3xl px-5 py-6 text-paper">
	<header class="flex flex-wrap items-center justify-between gap-3">
		<a href="/"><Wordmark light compact /></a>
		<Nav here="/register" name={data.user.name} />
	</header>
	<p class="mt-10 text-xs font-semibold tracking-[0.18em] text-gold uppercase">Issue a plate</p>
	<h1 class="display mt-2 text-6xl">Register a cabinet.</h1>
	<p class="mt-3 max-w-xl text-paper/70">Signet assigns the next licence and cuts two signed tags: one for the front panel, one for inside the locked door. The codes carry no names.</p>

	<form method="POST" class="card text-ink mt-8 space-y-4 p-5 md:p-6">
		{#if form?.message}
			<p class="rounded-2xl bg-[#fde4de] px-4 py-3 text-wax">{form.message}</p>
		{/if}
		<div class="grid gap-4 md:grid-cols-2">
			<label>Premises<input class="field mt-1" name="premises" value={form?.premises ?? ''} required /></label>
			<label>Address<input class="field mt-1" name="address" value={form?.address ?? ''} required /></label>
			<label>Ward<input class="field mt-1" name="ward" value={form?.ward ?? ''} required /></label>
			<label>County<input class="field mt-1" name="county" value={form?.county ?? 'Nairobi City'} /></label>
			<label>Operator<input class="field mt-1" name="operator" value={form?.operator ?? ''} required /></label>
			<label>Model<input class="field mt-1" name="model" value={form?.model ?? ''} placeholder="Upright cabinet" /></label>
			<label>Serial<input class="field mt-1" name="serial" value={form?.serial ?? ''} required /></label>
			<label>Licence state
				<select class="field mt-1" name="status">
					<option value="active" selected={form?.status !== 'suspended'}>Active</option>
					<option value="suspended" selected={form?.status === 'suspended'}>Suspended</option>
				</select>
			</label>
		</div>
		<button class="btn btn-seal" type="submit">Cut the tags</button>
		<p class="text-sm text-mist">{data.user.name} will be recorded as the verifier who opened this plate.</p>
	</form>
</main>
