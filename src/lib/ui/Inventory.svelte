<script lang="ts">
	import { SUBSTANCES, type Substance } from '../../data';
	import { getLocale, t } from '$lib/i18n';
	import { getUserMode, isVisibleAtMode } from '$lib/settings';
	import { addSubstance, getSelectedContainerId } from '$lib/lab';
	import HazardBadge from './HazardBadge.svelte';

	type InventoryCategory =
		| 'common'
		| 'acids'
		| 'bases'
		| 'salts'
		| 'metals'
		| 'gases'
		| 'oxides'
		| 'organic'
		| 'other';

	const COMMON_IDS: ReadonlySet<string> = new Set([
		'water',
		'hydrochloric-acid',
		'sodium-hydroxide',
		'oxygen-gas',
		'hydrogen-gas',
		'sodium-chloride',
		'Na',
		'Cu',
		'Fe',
		'Mg',
		'Zn'
	]);

	const CATEGORY_ORDER: ReadonlyArray<InventoryCategory> = [
		'common',
		'acids',
		'bases',
		'salts',
		'metals',
		'gases',
		'oxides',
		'organic',
		'other'
	];

	function categorize(s: Substance): InventoryCategory {
		if (COMMON_IDS.has(s.id)) return 'common';
		const refs = s.glossaryRefs ?? [];
		if (refs.includes('catalyst')) return 'oxides';
		if (refs.includes('acid')) return 'acids';
		if (refs.includes('base')) return 'bases';
		if (refs.includes('salt')) return 'salts';
		if (s.kind === 'element') {
			const cat = s.elementCategory;
			if (
				cat === 'alkali-metal' ||
				cat === 'alkaline-earth-metal' ||
				cat === 'transition-metal' ||
				cat === 'post-transition-metal'
			) {
				return 'metals';
			}
			if (cat === 'noble-gas' || s.defaultPhase === 'gas') return 'gases';
			return 'other';
		}
		if (s.defaultPhase === 'gas') return 'gases';
		if (s.smiles) return 'organic';
		return 'other';
	}

	let query = $state('');

	const visible = $derived.by(() => {
		const mode = getUserMode();
		return SUBSTANCES.filter((s) => isVisibleAtMode(s.difficulty, mode));
	});

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return visible;
		const locale = getLocale();
		return visible.filter(
			(s) =>
				s.id.toLowerCase().includes(q) ||
				s.formula.toLowerCase().includes(q) ||
				s.names[locale].toLowerCase().includes(q) ||
				s.names.en.toLowerCase().includes(q)
		);
	});

	const grouped = $derived.by(() => {
		// Без Map — правило svelte/prefer-svelte-reactivity.
		return CATEGORY_ORDER.map((cat) => ({
			category: cat,
			items: filtered
				.filter((s) => categorize(s) === cat)
				// Внутри категории — по русскому имени для предсказуемости.
				.slice()
				.sort((a, b) => a.names.ru.localeCompare(b.names.ru, 'ru'))
		})).filter((g) => g.items.length > 0);
	});

	const canAdd = $derived(getSelectedContainerId() !== null);

	function pick(s: Substance): void {
		const cid = getSelectedContainerId();
		if (!cid) return;
		addSubstance(cid, s.id, 1);
	}
</script>

<div class="space-y-3">
	{#if !canAdd}
		<div
			class="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-900/40"
			role="status"
		>
			{t('lab.selectFirst')}
		</div>
	{/if}

	<input
		type="search"
		bind:value={query}
		placeholder={t('lab.inventorySearch')}
		class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
	/>

	{#if grouped.length === 0}
		<div class="text-sm text-zinc-500 dark:text-zinc-400">{t('lab.inventoryEmpty')}</div>
	{:else}
		<div class="space-y-3">
			{#each grouped as group (group.category)}
				<details open class="group">
					<summary
						class="flex cursor-pointer items-center justify-between text-xs font-semibold tracking-wide text-zinc-500 uppercase select-none dark:text-zinc-400"
					>
						<span>{t(`lab.inventoryCategory.${group.category}`)}</span>
						<span class="font-mono text-[10px] opacity-60">{group.items.length}</span>
					</summary>
					<ul class="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
						{#each group.items as s (s.id)}
							<li>
								<button
									type="button"
									class="flex w-full items-center justify-between gap-2 rounded-md bg-zinc-100 px-2.5 py-1.5 text-left transition-colors enabled:hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 enabled:dark:hover:bg-blue-900/40"
									disabled={!canAdd}
									onclick={() => pick(s)}
									title={s.id}
								>
									<span class="flex min-w-0 items-center gap-1.5">
										<span class="truncate text-sm">{s.names[getLocale()]}</span>
										{#if s.hazards && s.hazards.length > 0}
											<span class="flex flex-shrink-0 items-center gap-0.5">
												{#each s.hazards as h (h)}
													<HazardBadge hazard={h} />
												{/each}
											</span>
										{/if}
									</span>
									<span class="flex-shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
										{s.formula}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				</details>
			{/each}
		</div>
	{/if}
</div>
