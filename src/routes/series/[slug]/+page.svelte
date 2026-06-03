<script lang="ts">
	import SeriesDetailView from '$lib/components/SeriesDetailView.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.series.title} — Лонгбокс</title>
	<meta name="description" content={data.series.description.slice(0, 160)} />
</svelte:head>

<a href="/" class="mb-4 inline-flex text-sm text-slate-400 hover:text-slate-200">← К каталогу</a>

<div class="rounded-xl border border-surface-border bg-surface p-5">
	<SeriesDetailView series={data.series} />
</div>
