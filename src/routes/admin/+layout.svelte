<script lang="ts">
	import { page } from '$app/stores';
	let { children } = $props();

	const onLogin = $derived($page.url.pathname === '/admin/login');
	const nav = [
		{ href: '/admin', label: 'Дашборд' },
		{ href: '/admin/series', label: 'Серии' },
		{ href: '/admin/hidden', label: 'Скрытые' },
		{ href: '/admin/comments', label: 'Комментарии' },
		{ href: '/admin/meta', label: 'Справочники' },
		{ href: '/admin/stats', label: 'Аналитика' }
	];

	function isActive(href: string): boolean {
		if (href === '/admin') return $page.url.pathname === '/admin';
		return $page.url.pathname.startsWith(href);
	}
</script>

{#if !onLogin}
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3">
		<nav class="flex flex-wrap gap-1">
			{#each nav as item}
				<a
					href={item.href}
					class="rounded-md px-3 py-1.5 text-sm {isActive(item.href)
						? 'bg-surface-raised text-slate-100'
						: 'text-slate-400 hover:text-slate-200'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>
		<form method="POST" action="/admin/logout">
			<button class="text-sm text-slate-500 hover:text-rose-400" type="submit">Выйти</button>
		</form>
	</div>
{/if}

{@render children()}
