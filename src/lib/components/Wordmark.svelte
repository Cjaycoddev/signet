<script lang="ts">
	let { light = false, compact = false }: { light?: boolean; compact?: boolean } = $props();
</script>

<span class="inline-flex items-center gap-2 {light ? 'text-paper' : 'text-ink'}">
	<svg viewBox="0 0 64 64" class={compact ? 'h-8 w-8' : 'h-11 w-11'} aria-hidden="true">
		<circle cx="32" cy="32" r="28" fill="#e23d2b" />
		<circle cx="32" cy="32" r="20" fill="none" stroke="#f6f0e6" stroke-width="1.6" />
		<text x="32" y="41" text-anchor="middle" fill="#f6f0e6" font-size="28" font-family="Georgia, serif">S</text>
	</svg>
	<span class="display text-3xl leading-none">Signet</span>
</span>
