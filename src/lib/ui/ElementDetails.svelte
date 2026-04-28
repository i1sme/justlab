<script lang="ts">
	import type { PeriodicElement } from '../../data/elements';
	import { getLocale, t } from '$lib/i18n';
	import AtomViewer from './AtomViewer.svelte';
	import TermLink from './TermLink.svelte';

	type Props = { element: PeriodicElement | null };
	let { element }: Props = $props();

	// $derived делает локаль реактивной: компонент перерендерится при setLocale().
	const locale = $derived(getLocale());
</script>

{#if element}
	<article
		class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
	>
		<AtomViewer {element} />

		<div class="mt-4 text-center">
			<h2 class="text-xl font-bold">{element.name[locale]}</h2>
			<p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
				{t(`category.${element.category}`)}
			</p>
		</div>

		<dl class="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
			<dt class="text-zinc-600 dark:text-zinc-400">
				<TermLink termKey="atomic-number">{t('element.number')}</TermLink>
			</dt>
			<dd class="font-medium">{element.number}</dd>

			<dt class="text-zinc-600 dark:text-zinc-400">
				<TermLink termKey="atomic-mass">{t('element.mass')}</TermLink>
			</dt>
			<dd class="font-medium">{element.atomicMass.toFixed(3)}</dd>

			<dt class="text-zinc-600 dark:text-zinc-400">
				<TermLink termKey="period">{t('element.period')}</TermLink>
			</dt>
			<dd class="font-medium">{element.period}</dd>

			<dt class="text-zinc-600 dark:text-zinc-400">
				<TermLink termKey="group">{t('element.group')}</TermLink>
			</dt>
			<dd class="font-medium">{element.group ?? '—'}</dd>

			<dt class="text-zinc-600 dark:text-zinc-400">
				<TermLink termKey="block">{t('element.block')}</TermLink>
			</dt>
			<dd class="font-medium uppercase">{element.block}</dd>
		</dl>
	</article>
{:else}
	<div
		class="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
	>
		{t('element.empty')}
	</div>
{/if}
