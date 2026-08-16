<script lang="ts">
	import { enhance } from '$app/forms';
	import { coverUrl } from '$lib/format';
	import { STATUSES, STATUS_LABELS, AUTHOR_ROLES, ROLE_LABELS } from '$lib/constants';
	import type { SeriesDetail } from '$lib/server/queries';

	let {
		series = null,
		publishers = [],
		universeOptions = [],
		authorOptions = [],
		action = '',
		error = null
	}: {
		series?: SeriesDetail | null;
		publishers?: { name: string }[];
		universeOptions?: { name: string }[];
		authorOptions?: { name: string }[];
		/** Form action target. Empty = page default action (used on the "new" page). */
		action?: string;
		error?: string | null;
	} = $props();

	let authors = $state(
		series?.authors.length
			? series.authors.map((a) => ({ name: a.name, role: a.role as string }))
			: [{ name: '', role: 'writer' }]
	);

	function addAuthor() {
		authors = [...authors, { name: '', role: 'writer' }];
	}
	function removeAuthor(i: number) {
		authors = authors.filter((_, idx) => idx !== i);
	}

	let submitting = $state(false);
</script>

<form
	method="POST"
	action={action}
	enctype="multipart/form-data"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
	class="grid gap-5 md:grid-cols-[1fr_260px]"
>
	<div class="space-y-4">
		{#if error}
			<p class="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
		{/if}

		<div>
			<label class="mb-1 block text-xs text-slate-400" for="title">Название (рус.) *</label>
			<input id="title" class="input" name="title" required value={series?.title ?? ''} />
		</div>

		<div>
			<label class="mb-1 block text-xs text-slate-400" for="titleOriginal">Оригинальное название</label>
			<input id="titleOriginal" class="input" name="titleOriginal" value={series?.titleOriginal ?? ''} placeholder="The Amazing Spider-Man" />
		</div>

		<div>
			<label class="mb-1 block text-xs text-slate-400" for="description">Описание</label>
			<textarea id="description" class="input min-h-28" name="description">{series?.description ?? ''}</textarea>
		</div>

		<div>
			<div class="mb-1 flex items-center justify-between">
				<span class="text-xs text-slate-400">Авторы</span>
				<button type="button" class="text-xs text-indigo-400 hover:text-indigo-300" onclick={addAuthor}>+ Добавить</button>
			</div>
			<div class="space-y-2">
				{#each authors as author, i (i)}
					<div class="flex gap-2">
						<input
							class="input flex-1"
							name="authorName"
							placeholder="Имя автора"
							list="author-list"
							bind:value={author.name}
						/>
						<select class="input w-40" name="authorRole" bind:value={author.role}>
							{#each AUTHOR_ROLES as r}
								<option value={r}>{ROLE_LABELS[r]}</option>
							{/each}
						</select>
						<button type="button" class="btn-ghost px-2" onclick={() => removeAuthor(i)} aria-label="Удалить">✕</button>
					</div>
				{/each}
			</div>
			<datalist id="author-list">
				{#each authorOptions as a}<option value={a.name}></option>{/each}
			</datalist>
		</div>

	</div>

	<div class="space-y-4">
		<div>
			<label class="mb-1 block text-xs text-slate-400" for="publisher">Издательство</label>
			<input id="publisher" class="input" name="publisher" list="pub-list" value={series?.publisher?.name ?? ''} />
			<datalist id="pub-list">
				{#each publishers as p}<option value={p.name}></option>{/each}
			</datalist>
		</div>

		<div>
			<label class="mb-1 block text-xs text-slate-400" for="universe">Вселенная</label>
			<input id="universe" class="input" name="universe" list="universe-list" value={series?.universe?.name ?? ''} placeholder="напр. Marvel Universe" />
			<datalist id="universe-list">
				{#each universeOptions as u}<option value={u.name}></option>{/each}
			</datalist>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<div>
				<label class="mb-1 block text-xs text-slate-400" for="status">Статус</label>
				<select id="status" class="input" name="status" value={series?.status ?? 'ongoing'}>
					{#each STATUSES as s}<option value={s}>{STATUS_LABELS[s]}</option>{/each}
				</select>
			</div>
			<div>
				<label class="mb-1 block text-xs text-slate-400" for="year">Год</label>
				<input id="year" class="input" name="year" type="number" min="1900" max="2100" value={series?.year ?? ''} />
			</div>
		</div>

		<div>
			<span class="mb-1 block text-xs text-slate-400">Обложка (запасная)</span>
			{#if series?.storedCoverPath}
				<div class="mb-2 aspect-[2/3] w-28 overflow-hidden rounded border border-surface-border">
					<img src={coverUrl(series.storedCoverPath)} alt="" class="h-full w-full object-cover" />
				</div>
				<label class="flex items-center gap-2 text-xs text-slate-400">
					<input type="checkbox" name="removeCover" /> Удалить обложку
				</label>
			{/if}
			<input class="input mt-2" name="cover" type="file" accept="image/*" />
			<p class="mt-1 text-[11px] text-slate-600">
				На сайте обложкой серии служит обложка ваншота или последнего релиза. Эта — запасная, если у релизов обложек нет.
			</p>
		</div>

		<button class="btn-primary w-full" type="submit" disabled={submitting}>
			{submitting ? 'Сохранение…' : series ? 'Сохранить' : 'Создать серию'}
		</button>
	</div>
</form>
