<script lang="ts">
	import { compact } from '$lib/format';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { Status } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const stats = $derived([
		{ label: 'Просмотры (30 дн.)', value: data.overview.views },
		{ label: 'Скачивания (30 дн.)', value: data.overview.downloads },
		{ label: 'Уник. посетители', value: data.overview.uniqueVisitors },
		{ label: 'Серий', value: data.overview.seriesCount },
		{ label: 'Выпусков', value: data.overview.issueCount },
		{ label: 'Комментариев', value: data.comments }
	]);
</script>

<svelte:head><title>CMS — Дашборд</title></svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-xl font-bold text-slate-100">Дашборд</h1>
	<a class="btn-primary" href="/admin/series/new">+ Новая серия</a>
</div>

<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
	{#each stats as s}
		<div class="rounded-lg border border-surface-border bg-surface-raised p-4">
			<div class="text-2xl font-bold text-slate-100">{compact(s.value)}</div>
			<div class="text-xs text-slate-400">{s.label}</div>
		</div>
	{/each}
</div>

<h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Недавно изменённые</h2>
<div class="mt-2 overflow-hidden rounded-lg border border-surface-border">
	<table class="w-full text-sm">
		<tbody class="divide-y divide-surface-border">
			{#each data.recent as s}
				<tr class="bg-surface-raised">
					<td class="px-3 py-2">
						<a class="font-medium text-slate-200 hover:text-indigo-300" href="/admin/series/{s.id}">{s.title}</a>
					</td>
					<td class="px-3 py-2"><StatusBadge status={s.status as Status} /></td>
					<td class="px-3 py-2 text-slate-500">{s.issueCount} вып.</td>
					<td class="px-3 py-2 text-right text-xs text-slate-600">{s.updatedAt}</td>
				</tr>
			{:else}
				<tr><td class="px-3 py-6 text-center text-slate-500">Пока нет серий. <a class="text-indigo-400" href="/admin/series/new">Добавьте первую</a>.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
