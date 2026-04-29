<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import LocaleSwitcher from '$lib/ui/LocaleSwitcher.svelte';
	import MotionToggle from '$lib/ui/MotionToggle.svelte';
	import UserModeButton from '$lib/ui/UserModeButton.svelte';
	import UserModeWizard from '$lib/ui/UserModeWizard.svelte';
	import { getUserMode } from '$lib/settings';
	import { t } from '$lib/i18n';

	let { children } = $props();

	// resolve(...) — SvelteKit-aware абсолютный путь (учитывает base path и т.п.).
	const navItems = [
		{ href: resolve('/'), key: 'nav.table' },
		{ href: resolve('/molecule'), key: 'nav.molecule' },
		{ href: resolve('/lab'), key: 'nav.lab' },
		{ href: resolve('/glossary'), key: 'nav.glossary' }
	];

	// Wizard открывается автоматически при первом заходе (userMode не выбран).
	// Пользователь может переоткрыть его кликом на иконку «шапочки» в хедере.
	let wizardOpen = $state(getUserMode() === null);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen">
	<header
		class="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80"
	>
		<div
			class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8"
		>
			<nav class="flex items-center gap-1" aria-label="Primary">
				{#each navItems as item (item.href)}
					{@const active =
						item.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(item.href)}
					<a
						href={item.href}
						aria-current={active ? 'page' : undefined}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
						class:bg-zinc-100={active}
						class:dark:bg-zinc-800={active}
						class:text-zinc-600={!active}
						class:dark:text-zinc-400={!active}
						class:hover:text-zinc-900={!active}
						class:dark:hover:text-zinc-100={!active}
					>
						{t(item.key)}
					</a>
				{/each}
			</nav>
			<div class="flex items-center gap-2">
				<UserModeButton onClick={() => (wizardOpen = true)} />
				<MotionToggle />
				<LocaleSwitcher />
			</div>
		</div>
	</header>

	{@render children()}
</div>

<UserModeWizard bind:open={wizardOpen} />
