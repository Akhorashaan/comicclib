<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Вход в CMS — Лонгбокс</title></svelte:head>

<div class="mx-auto mt-16 max-w-sm rounded-xl border border-surface-border bg-surface-raised p-6">
	<h1 class="text-lg font-bold text-slate-100">Вход в CMS</h1>
	<p class="mt-1 text-sm text-slate-400">Доступ только для администратора.</p>

	<form method="POST" use:enhance class="mt-4 space-y-3">
		<input
			class="input"
			type="password"
			name="password"
			placeholder="Пароль"
			autocomplete="current-password"
			required
			autofocus
		/>
		{#if form?.error}
			<p class="text-sm text-rose-400">{form.error}</p>
		{/if}
		<button class="btn-primary w-full" type="submit">Войти</button>
	</form>
</div>
