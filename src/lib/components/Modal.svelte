<script lang="ts">
	import type { Snippet } from 'svelte';
	let { onclose, children }: { onclose?: () => void; children: Snippet } = $props();

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose?.();
	}
</script>

<svelte:window {onkeydown} />

<div class="fixed inset-0 z-50 overflow-y-auto">
	<button
		class="fixed inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
		aria-label="Закрыть"
		onclick={() => onclose?.()}
	></button>
	<div class="relative mx-auto my-8 max-w-4xl px-4">
		<div
			class="relative rounded-xl border border-surface-border bg-surface p-5 shadow-2xl"
			role="dialog"
			aria-modal="true"
		>
			<button
				class="absolute right-3 top-3 z-10 rounded-md p-1 text-slate-400 hover:bg-surface-raised hover:text-white"
				aria-label="Закрыть"
				onclick={() => onclose?.()}
			>
				✕
			</button>
			{@render children()}
		</div>
	</div>
</div>
