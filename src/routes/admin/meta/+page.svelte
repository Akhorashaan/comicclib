<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { TaxRow } from '$lib/server/cms';

	let { data }: { data: PageData } = $props();

	const sections = $derived<{ table: string; title: string; rows: TaxRow[]; note: string }[]>([
		{ table: 'publishers', title: 'Издательства', rows: data.publishers, note: 'серий' },
		{ table: 'universes', title: 'Вселенные', rows: data.universes, note: 'серий' },
		{ table: 'authors', title: 'Авторы', rows: data.authors, note: 'связей' }
	]);
</script>

<svelte:head><title>CMS — Справочники</title></svelte:head>

<h1 class="text-xl font-bold text-slate-100">Справочники</h1>
<p class="mt-1 text-sm text-slate-400">
	Новые записи создаются автоматически при заполнении формы серии. Здесь можно переименовать или удалить лишние.
</p>

<div class="mt-5 grid gap-5 lg:grid-cols-3">
	{#each sections as section (section.table)}
		<div class="rounded-lg border border-surface-border bg-surface-raised">
			<h2 class="border-b border-surface-border px-4 py-2 text-sm font-semibold text-slate-200">{section.title}</h2>
			<ul class="divide-y divide-surface-border">
				{#each section.rows as row (row.id)}
					<li class="flex items-center gap-2 px-3 py-2">
						<form method="POST" action="?/rename" use:enhance class="flex flex-1 items-center gap-2">
							<input type="hidden" name="table" value={section.table} />
							<input type="hidden" name="id" value={row.id} />
							<input class="input flex-1 py-1 text-sm" name="name" value={row.name} />
							<span class="shrink-0 text-xs text-slate-500" title="{row.count} {section.note}">{row.count}</span>
							<button class="btn-ghost px-2 py-1 text-xs" type="submit">💾</button>
						</form>
						<form method="POST" action="?/delete" use:enhance={({ cancel }) => { if (!confirm(`Удалить «${row.name}»?`)) cancel(); return async ({ update }) => update(); }}>
							<input type="hidden" name="table" value={section.table} />
							<input type="hidden" name="id" value={row.id} />
							<button class="btn-ghost px-2 py-1 text-xs text-rose-400" type="submit">🗑</button>
						</form>
					</li>
				{:else}
					<li class="px-4 py-6 text-center text-sm text-slate-500">Пусто</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>
