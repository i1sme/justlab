<script lang="ts">
	import PeriodicTable2D from '$lib/ui/PeriodicTable2D.svelte';
	import ElementDetails from '$lib/ui/ElementDetails.svelte';
	import ElementSearch from '$lib/ui/ElementSearch.svelte';
	import CategoryLegend from '$lib/ui/CategoryLegend.svelte';
	import { t } from '$lib/i18n';
	import type { PeriodicElement } from '../data/elements';

	let selected = $state<PeriodicElement | null>(null);

	function selectElement(el: PeriodicElement): void {
		selected = el;
	}

	// ESC снимает выбор. Игнорируем событие, если фокус в поле ввода — пусть Esc
	// очищает поиск, а не убирает выделение в таблице.
	function onKeydown(e: KeyboardEvent): void {
		if (e.key !== 'Escape') return;
		const tag = (e.target as HTMLElement | null)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA') return;
		if (selected !== null) {
			selected = null;
			e.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>{t('app.title')} — {t('periodicTable.title')}</title>
	<meta name="description" content={t('app.tagline')} />
</svelte:head>

<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<header class="mb-5">
		<h1 class="text-3xl font-bold tracking-tight">{t('periodicTable.title')}</h1>
		<p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{t('app.tagline')}</p>
	</header>

	<p class="mb-4 max-w-2xl text-sm text-zinc-700 dark:text-zinc-300">{t('home.intro')}</p>

	<div class="mb-4 max-w-md">
		<ElementSearch onSelect={selectElement} />
	</div>

	<div class="grid gap-6 lg:grid-cols-[1fr_320px]">
		<div class="space-y-3">
			<PeriodicTable2D onSelect={selectElement} selectedNumber={selected?.number ?? null} />
			<details class="group">
				<summary
					class="cursor-pointer text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
				>
					{t('periodicTable.legend')}
				</summary>
				<div class="mt-2">
					<CategoryLegend />
				</div>
			</details>
		</div>
		<aside class="lg:sticky lg:top-6 lg:self-start">
			<ElementDetails element={selected} />
		</aside>
	</div>
</main>
