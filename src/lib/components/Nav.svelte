<script lang="ts">
	import { tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	type Row = {
		licence: string;
		premises: string;
		ward: string;
		serial: string;
		status: 'active' | 'suspended';
		due: boolean;
		front: 'live' | 'retired';
	};

	let { here = '', name = '', always = false }: { here?: string; name?: string; always?: boolean } = $props();

	const links = [
		['/desk', 'Desk'],
		['/board', 'Cabinets'],
		['/register', 'New cabinet'],
		['/tags', 'Tags'],
		['/scan', 'Scan']
	];

	let open = $state(false);
	let q = $state('');
	let book = $state<Row[] | null>(null);
	let loading = $state(false);
	let failed = $state(false);
	let drag = $state(0);
	let dragging = $state(false);
	let hold = $state(0);
	let burger: HTMLButtonElement | undefined = $state();
	let finder: HTMLInputElement | undefined = $state();
	let signOut: HTMLFormElement | undefined = $state();

	let startX = 0;
	let startY = 0;
	let tracking = false;
	let moved = false;
	let holdFrame = 0;

	const hits = $derived.by(() => {
		if (!book) return [];
		const query = q.trim().toLowerCase();
		if (!query) return book.filter((row) => row.due).slice(0, 3);
		return book
			.filter((row) => [row.licence, row.premises, row.ward, row.serial].join(' ').toLowerCase().includes(query))
			.slice(0, 4);
	});

	afterNavigate(() => {
		open = false;
		drag = 0;
	});

	$effect(() => {
		if (!open) return;
		const before = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close();
		};
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = before;
			window.removeEventListener('keydown', onKey);
		};
	});

	async function loadBook() {
		if (!name || book || loading) return;
		loading = true;
		failed = false;
		try {
			const response = await fetch('/api/cabinets');
			if (!response.ok) throw new Error('closed');
			book = ((await response.json()) as { cabinets: Row[] }).cabinets;
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	}

	async function toggle() {
		if (open) return close();
		open = true;
		void loadBook();
		await tick();
		finder?.focus({ preventScroll: true });
	}

	function close() {
		open = false;
		drag = 0;
		dragging = false;
		burger?.focus();
	}

	function down(event: PointerEvent) {
		if (event.pointerType === 'mouse') return;
		if ((event.target as HTMLElement).closest('.hold, input')) return;
		tracking = true;
		moved = false;
		startX = event.clientX;
		startY = event.clientY;
	}

	function move(event: PointerEvent) {
		if (!tracking) return;
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;
		if (!moved) {
			if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
			if (Math.abs(dy) > Math.abs(dx) || dx < 0) {
				tracking = false;
				return;
			}
			moved = true;
			dragging = true;
		}
		drag = Math.max(0, dx);
	}

	function up() {
		tracking = false;
		if (!dragging) return;
		dragging = false;
		if (drag > 90) close();
		else drag = 0;
	}

	function swallowClick(event: MouseEvent) {
		if (!moved) return;
		event.preventDefault();
		event.stopPropagation();
		moved = false;
	}

	function startHold(event: PointerEvent) {
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		const began = performance.now();
		const step = (now: number) => {
			hold = Math.min(1, (now - began) / 850);
			if (hold >= 1) {
				navigator.vibrate?.(30);
				signOut?.requestSubmit();
				return;
			}
			holdFrame = requestAnimationFrame(step);
		};
		holdFrame = requestAnimationFrame(step);
	}

	function stopHold() {
		cancelAnimationFrame(holdFrame);
		if (hold < 1) hold = 0;
	}
</script>

<nav class="{always ? 'hidden' : 'hidden md:flex'} gap-3 overflow-x-auto text-sm">
	{#each links as [href, label]}
		<a class={here === href ? 'font-semibold text-white' : 'text-gold'} {href}>{label}</a>
	{/each}
</nav>

<button
	bind:this={burger}
	class="burger {always ? '' : 'md:hidden'} {open ? 'is-open' : ''}"
	type="button"
	aria-expanded={open}
	aria-controls="signet-menu"
	aria-label={open ? 'Close menu' : 'Open menu'}
	onclick={toggle}
>
	<span></span><span></span><span></span>
</button>

{#if open}
	<button
		class="drawer-shade"
		type="button"
		aria-label="Close menu"
		tabindex="-1"
		style:opacity={1 - Math.min(drag, 300) / 360}
		onclick={close}
	></button>
	<div
		id="signet-menu"
		class="drawer {dragging ? 'dragging' : ''}"
		role="dialog"
		aria-modal="true"
		aria-label="Signet menu"
		tabindex="-1"
		style:transform={drag ? `translateX(${drag}px)` : undefined}
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
		onclickcapture={swallowClick}
	>
		<div class="pr-14">
			<p class="text-xs font-semibold tracking-[0.18em] text-gold uppercase">{name ? 'On duty' : 'Signet'}</p>
			<p class="display mt-1 text-3xl">{name || 'Verifier desk'}</p>
		</div>

		{#if name}
			<section>
				<label class="text-xs font-semibold tracking-[0.14em] text-paper/50 uppercase" for="menu-find">Find a cabinet</label>
				<input
					bind:this={finder}
					bind:value={q}
					id="menu-find"
					class="find mt-2"
					placeholder="731, Riverside, Kilimani…"
					autocomplete="off"
					inputmode="search"
				/>
				<div class="mt-2 space-y-1.5" aria-live="polite">
					{#if loading}
						<p class="px-1 text-sm text-paper/50">Opening the book…</p>
					{:else if failed}
						<p class="px-1 text-sm text-paper/50">The book did not open. The links below still work.</p>
					{:else if hits.length}
						{#if !q.trim()}<p class="px-1 text-xs text-paper/45">Due today</p>{/if}
						{#each hits as row}
							<a class="hit" href={`/scan?expect=${row.licence}`}>
								<span class="dot {row.status === 'suspended' ? 'dot-bad' : row.front === 'retired' ? 'dot-warn' : 'dot-good'}"></span>
								<span class="min-w-0 flex-1">
									<span class="block truncate font-semibold">{row.premises}</span>
									<span class="plate block text-xs text-paper/55">{row.licence} · {row.ward}</span>
								</span>
								<span class="text-xs font-semibold text-gold">Scan</span>
							</a>
						{/each}
					{:else if book}
						<p class="px-1 text-sm text-paper/50">No cabinet answers to “{q.trim()}”.</p>
					{/if}
				</div>
			</section>
		{/if}

		<nav class="space-y-1" aria-label="Pages">
			{#each links as [href, label], index}
				<a class="drawer-link {here === href ? 'is-on' : ''}" style="--i: {index}" {href} aria-current={here === href ? 'page' : undefined}>
					<span>{label}</span>
					<span aria-hidden="true" class="text-paper/35">→</span>
				</a>
			{/each}
		</nav>

		<div class="mt-auto space-y-2">
			{#if name}
				<form bind:this={signOut} method="POST" action="/logout">
					<button
						class="hold"
						type="button"
						style="--p: {hold}"
						onpointerdown={startHold}
						onpointerup={stopHold}
						onpointercancel={stopHold}
						onpointerleave={stopHold}
						onclick={(event) => {
							if (event.detail === 0) signOut?.requestSubmit();
						}}
					>
						<span>{hold > 0 ? 'Keep holding…' : 'Hold to sign out'}</span>
					</button>
				</form>
			{:else}
				<a class="btn btn-seal w-full" href="/login">Verifier sign in</a>
			{/if}
			<p class="text-center text-xs text-paper/40">Swipe right to close</p>
		</div>
	</div>
{/if}
