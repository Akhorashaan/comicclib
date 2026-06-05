<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDateTime } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>CMS — Комментарии</title></svelte:head>

<h1 class="text-xl font-bold text-slate-100">Комментарии</h1>
<p class="mt-1 text-sm text-slate-400">Последние комментарии (всего показано: {data.comments.length}).</p>

<div class="mt-4 overflow-x-auto rounded-lg border border-surface-border">
	<table class="w-full text-sm">
		<thead class="bg-surface-raised text-left text-xs uppercase text-slate-500">
			<tr>
				<th class="px-3 py-2">Дата</th>
				<th class="px-3 py-2">Серия</th>
				<th class="px-3 py-2">Автор</th>
				<th class="px-3 py-2">Комментарий</th>
				<th class="px-3 py-2"></th>
			</tr>
		</thead>
		<tbody class="divide-y divide-surface-border">
			{#each data.comments as c (c.id)}
				<tr class="bg-surface-raised/50 align-top">
					<td class="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{formatDateTime(c.createdAt)}</td>
					<td class="px-3 py-2">
						<a class="text-indigo-400 hover:text-indigo-300" href="/series/{c.seriesSlug}" target="_blank">{c.seriesTitle}</a>
					</td>
					<td class="whitespace-nowrap px-3 py-2 text-slate-400">{c.author || 'Аноним'}</td>
					<td class="px-3 py-2 text-slate-300"><div class="max-w-md whitespace-pre-line break-words">{c.body}</div></td>
					<td class="px-3 py-2 text-right">
						<form
							method="POST"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!confirm('Удалить комментарий?')) cancel();
								return async ({ update }) => update();
							}}
						>
							<input type="hidden" name="id" value={c.id} />
							<button class="text-xs text-rose-400 hover:text-rose-300" type="submit">Удалить</button>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="px-3 py-8 text-center text-slate-500">Комментариев пока нет.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
