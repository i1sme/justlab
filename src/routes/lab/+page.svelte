<script lang="ts">
	import ContainerCard from '$lib/ui/ContainerCard.svelte';
	import Inventory from '$lib/ui/Inventory.svelte';
	import ReactionInfo from '$lib/ui/ReactionInfo.svelte';
	import QuestPanel from '$lib/ui/QuestPanel.svelte';
	import { t } from '$lib/i18n';
	import {
		getExperiment,
		getSelectedContainerId,
		setSelectedContainerId,
		resetExperiment
	} from '$lib/lab';

	const experiment = $derived(getExperiment());
	const selectedId = $derived(getSelectedContainerId());

	function toggleSelect(id: string): void {
		setSelectedContainerId(selectedId === id ? null : id);
	}
</script>

<svelte:head>
	<title>{t('app.title')} — {t('lab.title')}</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<header class="mb-5 flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{t('lab.title')}</h1>
			<p class="mt-1 max-w-2xl text-sm text-zinc-700 dark:text-zinc-300">{t('lab.intro')}</p>
		</div>
		<button
			type="button"
			class="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
			onclick={() => resetExperiment()}
		>
			{t('lab.reset')}
		</button>
	</header>

	<div class="grid gap-6 lg:grid-cols-[1fr_360px]">
		<!-- Левая колонка: стол с посудой + последняя реакция -->
		<div class="space-y-4 lg:col-start-1 lg:row-start-1">
			<section>
				<h2
					class="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
				>
					{t('lab.containers')}
				</h2>
				<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
					{#each experiment.containers as c (c.id)}
						<ContainerCard
							container={c}
							selected={selectedId === c.id}
							onSelect={() => toggleSelect(c.id)}
						/>
					{/each}
				</div>
			</section>

			<ReactionInfo />
			<QuestPanel />
		</div>

		<!-- Правая sticky-колонка: инвентарь -->
		<aside class="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:self-start">
			<div
				class="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800"
			>
				<h2
					class="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
				>
					{t('lab.inventory')}
				</h2>
				<div class="max-h-[60vh] overflow-y-auto pr-1 lg:max-h-[calc(100vh-200px)]">
					<Inventory />
				</div>
			</div>
		</aside>
	</div>
</main>
