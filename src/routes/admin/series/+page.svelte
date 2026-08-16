<script lang="ts">
	import { enhance } from '$app/forms';
	import { compact } from '$lib/format';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { Status } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>CMS — Серии</title></svelte:head>

<div class="flex items-center justify-between gap-3">
	<h1 class="text-xl font-bold text-slate-100">Серии</h1>
	<a class="btn-primary" href="/admin/series/new">+ Новая серия</a>
</div>

<form method="GET" class="mt-4">
	<input class="input max-w-sm" type="search" name="q" placeholder="Поиск по названию…" value={data.q} />
</form>

<div class="mt-4 overflow-x-auto rounded-lg border border-surface-border">
	<table class="w-full text-sm">
		<thead class="bg-surface-raised text-left text-xs uppercase text-slate-500">
			<tr>
				<th class="px-3 py-2">Название</th>
				<th class="px-3 py-2">Издатель</th>
				<th class="px-3 py-2">Статус</th>
				<th class="px-3 py-2">Вып.</th>
				<th class="px-3 py-2">Просм.</th>
				<th class="px-3 py-2"></th>
			</tr>
		</thead>
		<tbody class="divide-y divide-surface-border">
			{#each data.rows as s (s.id)}
				<tr class="bg-surface-raised/50 {s.hidden ? 'opacity-60' : ''}">
					<td class="px-3 py-2">
						<a class="font-medium text-slate-200 hover:text-indigo-300" href="/admin/series/{s.id}">{s.title}</a>
						{#if s.year}<span class="ml-1 text-xs text-slate-500">{s.year}</span>{/if}
						{#if s.hidden}<span class="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">скрыта</span>{/if}
						{#if s.titleOriginal}<div class="text-xs italic text-slate-500">{s.titleOriginal}</div>{/if}
					</td>
					<td class="px-3 py-2 text-slate-400">{s.publisherName ?? '—'}</td>
					<td class="px-3 py-2"><StatusBadge status={s.status as Status} /></td>
					<td class="px-3 py-2 text-slate-400">{s.issueCount}</td>
					<td class="px-3 py-2 text-slate-400">{compact(s.views)}</td>
					<td class="px-3 py-2 text-right whitespace-nowrap">
						<a class="text-xs text-slate-400 hover:text-indigo-300" href="/admin/series/{s.id}">Изм.</a>
						<form method="POST" action="?/toggleHidden" class="ml-3 inline" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<input type="hidden" name="hidden" value={s.hidden ? '0' : '1'} />
							<button class="text-xs text-slate-400 hover:text-amber-300" type="submit">{s.hidden ? 'Показать' : 'Скрыть'}</button>
						</form>
						<form
							method="POST"
							action="?/delete"
							class="ml-3 inline"
							use:enhance={({ cancel }) => {
								if (!confirm(`Удалить серию «${s.title}» со всеми выпусками?`)) cancel();
								return async ({ update }) => update();
							}}
						>
							<input type="hidden" name="id" value={s.id} />
							<button class="text-xs text-rose-400 hover:text-rose-300" type="submit">Удалить</button>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="px-3 py-8 text-center text-slate-500">Серий нет.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
