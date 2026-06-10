<script lang="ts">
	import type { SeriesCard } from '$lib/server/queries';
	import { compact } from '$lib/format';
	import LazyImg from './LazyImg.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let {
		series,
		onpick
	}: { series: SeriesCard; onpick?: (slug: string) => void } = $props();

	function handleClick(e: MouseEvent) {
		// Preserve open-in-new-tab / modified clicks.
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
		if (!onpick) return;
		e.preventDefault();
		onpick(series.slug);
	}
</script>

<a
	href="/series/{series.slug}"
	onclick={handleClick}
	class="group block focus:outline-none"
	data-sveltekit-preload-data="off"
>
	<div
		class="relative aspect-[2/3] overflow-hidden rounded-lg border border-surface-border bg-surface-raised"
	>
		<LazyImg path={series.coverPath} alt={series.title} class="transition duration-300 group-hover:scale-[1.04]" />
		<div class="absolute left-2 top-2 rounded-full bg-black/55 shadow-sm shadow-black/40 backdrop-blur-sm">
			<StatusBadge status={series.status} />
		</div>
		{#if series.views > 0}
			<div
				class="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-slate-200 backdrop-blur"
			>
				👁 {compact(series.views)}
			</div>
		{/if}
	</div>
	<div class="mt-2">
		<h3 class="line-clamp-2 text-sm font-semibold leading-snug text-slate-100 group-hover:text-indigo-300">
			{series.title}
		</h3>
		{#if series.titleOriginal}
			<p class="line-clamp-1 text-xs italic text-slate-500">{series.titleOriginal}</p>
		{/if}
		<p class="mt-0.5 truncate text-xs text-slate-400">
			{series.publisherName ?? 'Без издателя'}{#if series.year} · {series.year}{/if}
		</p>
		{#if series.universeName}
			<p class="truncate text-[11px] text-indigo-300/80">🌐 {series.universeName}</p>
		{/if}
		<p class="mt-0.5 text-[11px] text-slate-600">{series.issueCount} вып.</p>
	</div>
</a>
