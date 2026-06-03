<script lang="ts">
	import { enhance } from '$app/forms';
	import AdminSeriesForm from '$lib/components/AdminSeriesForm.svelte';
	import { RELEASE_KINDS, RELEASE_KIND_LABELS } from '$lib/constants';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>CMS — {data.series.title}</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
	<a href="/admin/series" class="text-sm text-slate-400 hover:text-slate-200">← К списку</a>
	<a href="/series/{data.series.slug}" class="text-sm text-indigo-400 hover:text-indigo-300" target="_blank">Открыть на сайте ↗</a>
</div>

<h1 class="mb-1 text-xl font-bold text-slate-100">{data.series.title}</h1>
{#if form?.saved}<p class="mb-3 text-sm text-emerald-400">Сохранено.</p>{/if}

<AdminSeriesForm
	series={data.series}
	publishers={data.publishers}
	universeOptions={data.universes}
	authorOptions={data.authors}
	error={form?.error ?? null}
/>

<hr class="my-8 border-surface-border" />

<h2 class="text-lg font-bold text-slate-100">Релизы ({data.series.issues.length})</h2>
{#if form?.issueError}<p class="mt-2 text-sm text-rose-400">{form.issueError}</p>{/if}

<p class="mt-1 text-xs text-slate-500">
	Релиз может быть отдельным выпуском или собранным томом. У серии могут быть и те, и другие одновременно.
</p>

<!-- Add release -->
<form method="POST" action="?/addIssue" use:enhance class="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-surface-border bg-surface-raised p-3 md:grid-cols-6">
	<select class="input" name="kind">
		{#each RELEASE_KINDS as k}<option value={k}>{RELEASE_KIND_LABELS[k]}</option>{/each}
	</select>
	<input class="input" name="number" placeholder="№ *" required />
	<input class="input md:col-span-3" name="title" placeholder="Заголовок" />
	<input class="input md:col-span-2" name="collects" placeholder="собирает (для тома), напр. #1–6" />
	<input class="input md:col-span-4" name="downloadUrl" type="url" placeholder="Ссылка на скачивание *" required />
	<button class="btn-primary md:col-span-2" type="submit">+ Добавить релиз</button>
</form>

<!-- Existing releases -->
<div class="mt-3 space-y-2">
	{#each data.series.issues as issue (issue.id)}
		<form
			method="POST"
			action="?/updateIssue"
			use:enhance
			class="grid grid-cols-2 items-center gap-2 rounded-lg border border-surface-border p-2 md:grid-cols-[96px_64px_1.6fr_1.4fr_2fr_auto]"
		>
			<input type="hidden" name="issueId" value={issue.id} />
			<select class="input" name="kind" value={issue.kind}>
				{#each RELEASE_KINDS as k}<option value={k}>{RELEASE_KIND_LABELS[k]}</option>{/each}
			</select>
			<input class="input" name="number" value={issue.number} required />
			<input class="input" name="title" value={issue.title} placeholder="Заголовок" />
			<input class="input" name="collects" value={issue.collects ?? ''} placeholder="собирает (для тома)" />
			<input class="input" name="downloadUrl" type="url" value={issue.downloadUrl} required />
			<div class="flex gap-1">
				<button class="btn-ghost px-2 py-1 text-xs" type="submit">💾</button>
				<button
					class="btn-ghost px-2 py-1 text-xs text-rose-400"
					type="submit"
					formaction="?/deleteIssue"
					onclick={(e) => { if (!confirm(`Удалить релиз №${issue.number}?`)) e.preventDefault(); }}
				>🗑</button>
			</div>
		</form>
	{:else}
		<p class="text-sm text-slate-500">Релизов пока нет.</p>
	{/each}
</div>
