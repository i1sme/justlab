<script lang="ts">
	import {
		MOLECULES,
		MOLECULE_CATEGORIES,
		type CuratedMolecule,
		type MoleculeCategoryKey
	} from '../../data';
	import { getLocale, t } from '$lib/i18n';

	type Props = { onPick: (smiles: string) => void };
	let { onPick }: Props = $props();

	let query = $state('');

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return MOLECULES;
		const locale = getLocale();
		return MOLECULES.filter(
			(m) =>
				m.name[locale].toLowerCase().includes(q) ||
				m.name.en.toLowerCase().includes(q) ||
				m.formula.toLowerCase().includes(q) ||
				m.smiles.toLowerCase().includes(q) ||
				m.key.includes(q)
		);
	});

	const grouped = $derived.by(() => {
		// Линейная свёртка без Map (правило svelte/prefer-svelte-reactivity).
		// 30 элементов × 6 категорий = 180 сравнений — пренебрежимо.
		return MOLECULE_CATEGORIES.map((cat) => ({
			category: cat as MoleculeCategoryKey,
			items: filtered.filter((m: CuratedMolecule) => m.category === cat)
		})).filter((g) => g.items.length > 0);
	});
</script>

<div class="space-y-3">
	<input
		type="search"
		bind:value={query}
		placeholder={t('molecule.librarySearch')}
		class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
	/>

	{#if grouped.length === 0}
		<div class="text-sm text-zinc-500 dark:text-zinc-400">{t('molecule.empty')}</div>
	{:else}
		{#each grouped as group (group.category)}
			<section>
				<h3
					class="mb-1.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
				>
					{t(`molCategory.${group.category}`)}
				</h3>
				<ul class="grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-3">
					{#each group.items as m (m.key)}
						<li>
							<button
								type="button"
								class="flex w-full items-baseline justify-between gap-2 rounded-md bg-zinc-100 px-2.5 py-1.5 text-left transition-colors hover:bg-blue-100 dark:bg-zinc-800 dark:hover:bg-blue-900/40"
								onclick={() => onPick(m.smiles)}
								title={m.smiles}
							>
								<span class="text-sm font-medium">{m.name[getLocale()]}</span>
								<span class="flex-shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
									{m.formula}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
</div>
