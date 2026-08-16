<script lang="ts">
	import { enhance } from '$app/forms';
	import AdminSeriesForm from '$lib/components/AdminSeriesForm.svelte';
	import { coverUrl } from '$lib/format';
	import { RELEASE_KINDS, RELEASE_KIND_LABELS } from '$lib/constants';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>CMS — {data.series.title}</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
	<a href="/admin/series" class="text-sm text-slate-400 hover:text-slate-200">← К списку</a>
	<a href="/series/{data.series.slug}" class="text-sm text-indigo-400 hover:text-indigo-300" target="_blank">Открыть на сайте ↗</a>
</div>

<div class="mb-1 flex flex-wrap items-center gap-3">
	<h1 class="text-xl font-bold text-slate-100">{data.series.title}</h1>
	{#if data.series.hidden}
		<span class="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">Скрыта</span>
	{/if}
	<form method="POST" action="?/toggleSeriesHidden" use:enhance class="ml-auto">
		<input type="hidden" name="hidden" value={data.series.hidden ? '0' : '1'} />
		<button class="btn-ghost px-3 py-1 text-xs" type="submit">
			{data.series.hidden ? '👁 Показать серию' : '🚫 Скрыть серию'}
		</button>
	</form>
</div>
{#if form?.saved}<p class="mb-3 text-sm text-emerald-400">Сохранено.</p>{/if}

<AdminSeriesForm
	series={data.series}
	publishers={data.publishers}
	universeOptions={data.universes}
	authorOptions={data.authors}
	action="?/saveSeries"
	error={form?.error ?? null}
/>

<hr class="my-8 border-surface-border" />

<h2 class="text-lg font-bold text-slate-100">Релизы ({data.series.issues.length})</h2>
{#if form?.issueError}<p class="mt-2 text-sm text-rose-400">{form.issueError}</p>{/if}

<p class="mt-1 text-xs text-slate-500">
	Релиз — это <b>выпуск</b>, собранный <b>том</b> или <b>ваншот</b> (вся серия одним изданием, без номера/названия).
	У серии могут быть разные релизы одновременно.
</p>

<!-- Add release -->
<form method="POST" action="?/addIssue" enctype="multipart/form-data" use:enhance class="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-surface-border bg-surface-raised p-3 md:grid-cols-6">
	<select class="input" name="kind">
		{#each RELEASE_KINDS as k}<option value={k}>{RELEASE_KIND_LABELS[k]}</option>{/each}
	</select>
	<input class="input" name="number" placeholder="№ (для выпуска/тома)" />
	<input class="input md:col-span-2" name="title" placeholder="Заголовок (необязательно)" />
	<input class="input md:col-span-2" name="collects" placeholder="собирает (для тома), напр. #1–6" />
	<input class="input md:col-span-3" name="downloadUrl" type="url" placeholder="Ссылка на скачивание *" required />
	<input class="input md:col-span-3" name="cover" type="file" accept="image/*" title="Обложка релиза" />
	<button class="btn-primary md:col-span-6" type="submit">+ Добавить релиз</button>
</form>

<!-- Existing releases -->
<div class="mt-3 space-y-2">
	{#each data.series.issues as issue (issue.id)}
		<form
			method="POST"
			action="?/updateIssue"
			enctype="multipart/form-data"
			use:enhance
			class="flex flex-wrap items-start gap-3 rounded-lg border p-2 {issue.hidden ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-surface-border'}"
		>
			<input type="hidden" name="issueId" value={issue.id} />
			<!-- cover thumbnail -->
			<div class="h-[84px] w-14 shrink-0 overflow-hidden rounded border border-surface-border bg-surface-raised">
				{#if issue.coverPath}
					<img src={coverUrl(issue.coverPath)} alt="" class="h-full w-full object-cover" />
				{:else}
					<div class="flex h-full w-full items-center justify-center text-[10px] text-slate-600">нет</div>
				{/if}
			</div>
			<!-- fields -->
			<div class="grid flex-1 grid-cols-2 gap-2 md:grid-cols-[96px_64px_1fr_1fr]">
				<select class="input" name="kind" value={issue.kind}>
					{#each RELEASE_KINDS as k}<option value={k}>{RELEASE_KIND_LABELS[k]}</option>{/each}
				</select>
				<input class="input" name="number" value={issue.number} placeholder="№" />
				<input class="input" name="title" value={issue.title} placeholder="Заголовок" />
				<input class="input" name="collects" value={issue.collects ?? ''} placeholder="собирает (для тома)" />
				<input class="input md:col-span-2" name="downloadUrl" type="url" value={issue.downloadUrl} required />
				<input class="input md:col-span-2" name="cover" type="file" accept="image/*" title="Заменить обложку" />
				{#if issue.coverPath}
					<label class="flex items-center gap-1 text-xs text-slate-400 md:col-span-2">
						<input type="checkbox" name="removeCover" /> Удалить обложку
					</label>
				{/if}
			</div>
			<!-- actions -->
			<div class="flex flex-col gap-1">
				{#if issue.hidden}
					<span class="text-center text-[10px] font-medium text-amber-400">скрыт</span>
				{/if}
				<div class="flex gap-1">
					<button class="btn-ghost px-2 py-1 text-xs" type="submit" title="Сохранить">💾</button>
					<button
						class="btn-ghost px-2 py-1 text-xs"
						type="submit"
						name="hidden"
						value={issue.hidden ? '0' : '1'}
						formaction="?/toggleIssueHidden"
						title={issue.hidden ? 'Показать релиз' : 'Скрыть релиз'}
					>{issue.hidden ? '👁' : '🚫'}</button>
					<button
						class="btn-ghost px-2 py-1 text-xs text-rose-400"
						type="submit"
						formaction="?/deleteIssue"
						onclick={(e) => { if (!confirm('Удалить этот релиз?')) e.preventDefault(); }}
						title="Удалить"
					>🗑</button>
				</div>
			</div>
		</form>
	{:else}
		<p class="text-sm text-slate-500">Релизов пока нет.</p>
	{/each}
</div>
