<script lang="ts">
	import {
		GLOSSARY,
		GLOSSARY_CATEGORIES,
		type GlossaryCategory,
		type GlossaryTerm
	} from '../../data';
	import { getLocale, t } from '$lib/i18n';

	let query = $state('');

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const locale = getLocale();
		if (!q) return GLOSSARY;
		return GLOSSARY.filter(
			(g) =>
				g.term.ru.toLowerCase().includes(q) ||
				g.term.en.toLowerCase().includes(q) ||
				g.definition[locale].toLowerCase().includes(q) ||
				g.key.includes(q)
		);
	});

	const grouped = $derived.by(() => {
		return GLOSSARY_CATEGORIES.map((cat) => ({
			category: cat as GlossaryCategory,
			items: filtered.filter((g: GlossaryTerm) => g.category === cat)
		})).filter((g) => g.items.length > 0);
	});
</script>

<svelte:head>
	<title>{t('app.title')} — {t('glossary.title')}</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
	<header class="mb-5">
		<h1 class="text-3xl font-bold tracking-tight">{t('glossary.title')}</h1>
		<p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{t('glossary.intro')}</p>
	</header>

	<input
		type="search"
		bind:value={query}
		placeholder={t('glossary.search')}
		class="mb-6 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
	/>

	{#if grouped.length === 0}
		<div class="text-sm text-zinc-600 dark:text-zinc-400">{t('glossary.empty')}</div>
	{:else}
		<div class="space-y-8">
			{#each grouped as group (group.category)}
				<section>
					<h2
						class="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
					>
						{t(`glossary.category.${group.category}`)}
					</h2>
					<dl class="space-y-3">
						{#each group.items as term (term.key)}
							<div
								class="rounded-xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
							>
								<dt class="font-semibold">{term.term[getLocale()]}</dt>
								<dd class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
									{term.definition[getLocale()]}
								</dd>
							</div>
						{/each}
					</dl>
				</section>
			{/each}
		</div>
	{/if}
</main>
