<script lang="ts">
	import { coverUrl } from '$lib/format';
	let {
		path,
		alt,
		class: klass = ''
	}: { path: string | null | undefined; alt: string; class?: string } = $props();
	const src = $derived(coverUrl(path));
</script>

{#if src}
	<img
		{src}
		{alt}
		loading="lazy"
		decoding="async"
		class="h-full w-full object-cover {klass}"
	/>
{:else}
	<div
		class="flex h-full w-full items-center justify-center bg-surface-raised text-xs text-slate-600 {klass}"
	>
		нет обложки
	</div>
{/if}
