<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { RELEASE_KIND_LABELS, type Status } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const releaseLabel = (i: PageData['issues'][number]) =>
		i.kind === 'oneshot'
			? RELEASE_KIND_LABELS.oneshot
			: `${RELEASE_KIND_LABELS[i.kind]} ${i.number}`;
</script>

<svelte:head><title>CMS — Скрытые</title></svelte:head>

<h1 class="text-xl font-bold text-slate-100">Скрытые (черновики)</h1>
<p class="mt-1 text-sm text-slate-500">
	Серии и релизы, помеченные как скрытые, не показываются на сайте. Здесь их можно вернуть в публикацию.
</p>

<!-- Hidden series -->
<h2 class="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
	Скрытые серии ({data.series.length})
</h2>
<div class="mt-2 overflow-hidden rounded-lg border border-surface-border">
	<table class="w-full text-sm">
		<tbody class="divide-y divide-surface-border">
			{#each data.series as s (s.id)}
				<tr class="bg-surface-raised/50">
					<td class="px-3 py-2">
						<a class="font-medium text-slate-200 hover:text-indigo-300" href="/admin/series/{s.id}">{s.title}</a>
					</td>
					<td class="px-3 py-2"><StatusBadge status={s.status as Status} /></td>
					<td class="px-3 py-2 text-slate-500">{s.issueCount} вып.</td>
					<td class="px-3 py-2 text-right">
						<form method="POST" action="?/showSeries" class="inline" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button class="text-xs text-emerald-400 hover:text-emerald-300" type="submit">Показать</button>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td class="px-3 py-6 text-center text-slate-500">Скрытых серий нет.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<!-- Hidden releases -->
<h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
	Скрытые релизы ({data.issues.length})
</h2>
<div class="mt-2 overflow-hidden rounded-lg border border-surface-border">
	<table class="w-full text-sm">
		<tbody class="divide-y divide-surface-border">
			{#each data.issues as i (i.id)}
				<tr class="bg-surface-raised/50">
					<td class="px-3 py-2">
						<a class="font-medium text-slate-200 hover:text-indigo-300" href="/admin/series/{i.seriesId}">{i.seriesTitle}</a>
						<span class="text-slate-500"> · {releaseLabel(i)}</span>
						{#if i.title}<span class="text-slate-500"> — {i.title}</span>{/if}
					</td>
					<td class="px-3 py-2 text-right">
						<form method="POST" action="?/showIssue" class="inline" use:enhance>
							<input type="hidden" name="id" value={i.id} />
							<button class="text-xs text-emerald-400 hover:text-emerald-300" type="submit">Показать</button>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td class="px-3 py-6 text-center text-slate-500">Скрытых релизов нет.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
