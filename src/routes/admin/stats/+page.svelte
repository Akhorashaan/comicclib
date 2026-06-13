<script lang="ts">
	import { compact } from '$lib/format';
	import MiniChart from '$lib/components/MiniChart.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const periods = [
		{ days: 7, label: '7 дней' },
		{ days: 30, label: '30 дней' },
		{ days: 90, label: '90 дней' },
		{ days: 365, label: 'Год' }
	];
	const cards = $derived([
		{ label: 'Просмотры', value: data.overview.views },
		{ label: 'Скачивания', value: data.overview.downloads },
		{ label: 'Уник. посетители', value: data.overview.uniqueVisitors }
	]);

	// "Остальные" — то, что не вошло в топ-15, чтобы суммы сходились с итогами.
	const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
	const otherViews = $derived(Math.max(0, data.overview.views - sum(data.topSeries.map((s) => s.views))));
	const otherSeriesDl = $derived(Math.max(0, data.overview.downloads - sum(data.topSeries.map((s) => s.downloads))));
	const otherIssueDl = $derived(Math.max(0, data.overview.downloads - sum(data.topIssues.map((i) => i.downloads))));
</script>

<svelte:head><title>CMS — Аналитика</title></svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-xl font-bold text-slate-100">Аналитика</h1>
	<div class="flex gap-1">
		{#each periods as p}
			<a
				href="?days={p.days}"
				class="rounded-md px-3 py-1.5 text-sm {data.days === p.days ? 'bg-indigo-600 text-white' : 'border border-surface-border text-slate-400 hover:text-slate-200'}"
			>{p.label}</a>
		{/each}
	</div>
</div>

<div class="mt-4 grid grid-cols-3 gap-3">
	{#each cards as c}
		<div class="rounded-lg border border-surface-border bg-surface-raised p-4">
			<div class="text-2xl font-bold text-slate-100">{compact(c.value)}</div>
			<div class="text-xs text-slate-400">{c.label} за период</div>
		</div>
	{/each}
</div>

<div class="mt-4 grid gap-3 lg:grid-cols-3">
	<MiniChart data={data.series} metric="views" label="Заходы" color="#818cf8" />
	<MiniChart data={data.series} metric="uniques" label="Уник. посетители" color="#34d399" />
	<MiniChart data={data.series} metric="downloads" label="Скачивания" color="#38bdf8" />
</div>

<div class="mt-6 grid gap-5 lg:grid-cols-2">
	<div>
		<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Топ серий</h2>
		<div class="overflow-hidden rounded-lg border border-surface-border">
			<table class="w-full text-sm">
				<thead class="bg-surface-raised text-left text-xs uppercase text-slate-500">
					<tr><th class="px-3 py-2">Серия</th><th class="px-3 py-2 text-right">👁</th><th class="px-3 py-2 text-right">⬇</th></tr>
				</thead>
				<tbody class="divide-y divide-surface-border">
					{#each data.topSeries as s (s.id)}
						<tr class="bg-surface-raised/50">
							<td class="px-3 py-2"><a class="text-slate-200 hover:text-indigo-300" href="/admin/series/{s.id}">{s.title}</a></td>
							<td class="px-3 py-2 text-right text-slate-400">{compact(s.views)}</td>
							<td class="px-3 py-2 text-right text-slate-400">{compact(s.downloads)}</td>
						</tr>
					{:else}
						<tr><td colspan="3" class="px-3 py-6 text-center text-slate-500">Нет данных за период.</td></tr>
					{/each}
					{#if data.topSeries.length && (otherViews > 0 || otherSeriesDl > 0)}
						<tr class="bg-surface-raised/30 italic text-slate-500">
							<td class="px-3 py-2">Остальные серии</td>
							<td class="px-3 py-2 text-right">{compact(otherViews)}</td>
							<td class="px-3 py-2 text-right">{compact(otherSeriesDl)}</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<div>
		<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Топ выпусков по скачиваниям</h2>
		<div class="overflow-hidden rounded-lg border border-surface-border">
			<table class="w-full text-sm">
				<thead class="bg-surface-raised text-left text-xs uppercase text-slate-500">
					<tr><th class="px-3 py-2">Выпуск</th><th class="px-3 py-2 text-right">⬇</th></tr>
				</thead>
				<tbody class="divide-y divide-surface-border">
					{#each data.topIssues as i (i.id)}
						<tr class="bg-surface-raised/50">
							<td class="px-3 py-2 text-slate-300">
								<a class="hover:text-indigo-300" href="/series/{i.seriesSlug}" target="_blank">{i.seriesTitle}</a>
								<span class="text-slate-500"> · #{i.number}</span>
							</td>
							<td class="px-3 py-2 text-right text-slate-400">{compact(i.downloads)}</td>
						</tr>
					{:else}
						<tr><td colspan="2" class="px-3 py-6 text-center text-slate-500">Нет данных за период.</td></tr>
					{/each}
					{#if data.topIssues.length && otherIssueDl > 0}
						<tr class="bg-surface-raised/30 italic text-slate-500">
							<td class="px-3 py-2">Остальные выпуски</td>
							<td class="px-3 py-2 text-right">{compact(otherIssueDl)}</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
