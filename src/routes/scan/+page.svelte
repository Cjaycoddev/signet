<script lang="ts">
	import { onMount } from 'svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';

	type InspectResult = {
		ok: boolean;
		outcome: string;
		headline: string;
		detail: string;
		tag?: { role: string; state: string; placement: string; size: string };
		machine?: {
			licence: string;
			premises: string;
			address: string;
			ward: string;
			operator: string;
			model: string;
			serial: string;
			lastInspection: string;
		};
	};

	let { data } = $props();
	let video: HTMLVideoElement | undefined = $state();
	let message = $state('Tap the frame, then hold the tag inside the corners.');
	let busy = $state(false);
	let live = $state(false);
	let result = $state<InspectResult | null>(null);
	let locked = false;
	let stopCamera = () => {};
	let QrReader: (new (elementId: string) => { start: Function; stop: () => Promise<void> }) | null = null;

	const stampTone = (outcome: string) => {
		if (outcome === 'sealed' || outcome === 'backup') return 'good';
		if (outcome === 'retired' || outcome === 'mismatch') return 'warn';
		return 'bad';
	};

	async function submit(code: string) {
		if (busy) return;
		busy = true;
		message = 'Reading the seal…';
		try {
			const response = await fetch('/api/verify', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ code, expected: data.expected })
			});
			result = (await response.json()) as InspectResult;
			message = result.headline;
		} catch {
			message = 'The register did not answer. Try the tag again.';
			locked = false;
		} finally {
			busy = false;
		}
	}

	function reset() {
		result = null;
		locked = false;
		message = 'Point at the next plate.';
	}

	async function fromFile(file: File) {
		const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: ImageBitmap) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
		if (Detector) {
			const bitmap = await createImageBitmap(file);
			const hits = await new Detector({ formats: ['qr_code'] }).detect(bitmap);
			if (hits[0]?.rawValue) {
				locked = true;
				await submit(hits[0].rawValue);
				return;
			}
		}
		const { Html5Qrcode } = await import('html5-qrcode');
		const reader = new Html5Qrcode('photo-reader');
		const text = await reader.scanFile(file, false);
		locked = true;
		await submit(text);
		reader.clear();
	}

	async function openCamera() {
		if (live) return;
		const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
		try {
			if (!Detector) {
				const Ctor = QrReader ?? (await import('html5-qrcode')).Html5Qrcode;
				const reader = new Ctor('qr-fallback');
				await reader.start(
					{ facingMode: 'environment' },
					{ fps: 10, qrbox: { width: 220, height: 220 } },
					(text: string) => {
						if (locked) return;
						locked = true;
						void submit(text);
					},
					() => {}
				);
				stopCamera = () => {
					void reader.stop().catch(() => {});
				};
			} else if (video) {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: false,
					video: { facingMode: { ideal: 'environment' } }
				});
				video.srcObject = stream;
				await video.play();
				const detector = new Detector({ formats: ['qr_code'] });
				let timer = 0;
				let dead = false;
				const tick = async () => {
					if (dead) return;
					if (!locked && video && video.readyState >= 2) {
						try {
							const hits = await detector.detect(video);
							if (hits[0]?.rawValue) {
								locked = true;
								await submit(hits[0].rawValue);
							}
						} catch {
							/* a dropped frame is fine */
						}
					}
					timer = window.setTimeout(tick, 160);
				};
				void tick();
				stopCamera = () => {
					dead = true;
					window.clearTimeout(timer);
					stream.getTracks().forEach((track) => track.stop());
				};
			}
			live = true;
			message = 'Hold the tag steady inside the corners.';
		} catch {
			message = 'The camera stayed shut. Allow camera access, or take a photo of the tag.';
		}
	}

	onMount(() => {
		void import('html5-qrcode').then((mod) => {
			QrReader = mod.Html5Qrcode;
		});
		return () => stopCamera();
	});
</script>

<svelte:head>
	<title>Scan · Signet</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-4 text-paper">
	<header class="flex items-center justify-between">
		<a href="/desk"><Wordmark light compact /></a>
		<Nav here="/scan" name={data.user.name} always />
	</header>

	<div class="finder mt-4">
		<video bind:this={video} class="absolute inset-0 h-full w-full object-cover" playsinline autoplay muted></video>
		<div id="qr-fallback" class="absolute inset-0"></div>
		<div class="brackets" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
		{#if !live}
			<button class="absolute inset-0 z-10 grid place-items-center" type="button" onclick={openCamera}>
				<span class="btn btn-seal">Open camera</span>
			</button>
		{/if}
	</div>
	<div id="photo-reader" class="hidden"></div>

	<p class="mt-4 text-center text-sm text-paper/75">{message}</p>
	{#if data.expected}
		<p class="mt-1 text-center plate text-xs text-gold">Looking for {data.expected}</p>
	{/if}

	<label class="btn btn-ghost mt-4 w-full">
		Use a photo of the tag
		<input
			class="sr-only"
			type="file"
			accept="image/*"
			capture="environment"
			onchange={(event) => {
				const file = event.currentTarget.files?.[0];
				if (file) void fromFile(file);
			}}
		/>
	</label>

	{#if result}
		<section class="sheet card text-ink mt-4 p-5">
			<div class="flex items-start justify-between gap-3">
				<p class="stamp {stampTone(result.outcome)}">{result.outcome}</p>
				<button class="text-sm font-semibold text-wax" type="button" onclick={reset}>Scan another</button>
			</div>
			<h1 class="display mt-4 text-5xl">{result.headline}</h1>
			<p class="mt-3 text-mist">{result.detail}</p>
			{#if result.machine}
				<p class="plate mt-5 text-lg">{result.machine.licence}</p>
				<h2 class="display text-4xl">{result.machine.premises}</h2>
				<p class="text-sm text-mist">{result.machine.address} · {result.machine.ward}</p>
				<dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
					<div><dt class="text-mist">Operator</dt><dd class="font-semibold">{result.machine.operator}</dd></div>
					<div><dt class="text-mist">Model</dt><dd class="font-semibold">{result.machine.model}</dd></div>
					<div><dt class="text-mist">Serial</dt><dd class="font-semibold">{result.machine.serial}</dd></div>
					<div><dt class="text-mist">Last visit</dt><dd class="font-semibold">{result.machine.lastInspection}</dd></div>
				</dl>
				{#if result.tag}
					<p class="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm">
						<span class="font-semibold capitalize">{result.tag.role} tag.</span>
						{result.tag.size}. {result.tag.placement}
					</p>
				{/if}
			{/if}
		</section>
	{/if}
</main>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}
	.hidden { display: none; }
</style>
