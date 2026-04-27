<script lang="ts">
	import { parseSmiles, type ParsedMolecule } from '$lib/chemistry/openchemlib';
	import { supportsWebGL2 } from '$lib/render3d/webgl-detect';
	import { t } from '$lib/i18n';
	import Molecule3D from './Molecule3D.svelte';
	import MoleculeLibrary from './MoleculeLibrary.svelte';

	type Mode = '3d' | '2d';

	const SVG_W = 480;
	const SVG_H = 320;

	let input = $state('CCO');
	let molecule = $state<ParsedMolecule | null>(null);
	let loading = $state(false);
	let error = $state(false);

	const canUse3D = supportsWebGL2();
	let mode = $state<Mode>(canUse3D ? '3d' : '2d');

	let lastQuery = '';
	let pendingTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const value = input;
		if (pendingTimer) clearTimeout(pendingTimer);
		pendingTimer = setTimeout(() => {
			void parse(value);
		}, 150);
		return () => {
			if (pendingTimer) clearTimeout(pendingTimer);
		};
	});

	async function parse(smiles: string): Promise<void> {
		const trimmed = smiles.trim();
		if (!trimmed) {
			molecule = null;
			error = false;
			loading = false;
			lastQuery = '';
			return;
		}
		if (trimmed === lastQuery && molecule) return;
		lastQuery = trimmed;

		loading = true;
		const result = await parseSmiles(trimmed, SVG_W, SVG_H);
		if (lastQuery !== trimmed) return;

		loading = false;
		if (result) {
			molecule = result;
			error = false;
		} else {
			molecule = null;
			error = true;
		}
	}

	function pickFromLibrary(smiles: string): void {
		input = smiles;
	}
</script>

<!-- Двухколоночная разметка на lg+: viewer слева (всегда на виду), элементы выбора в sticky-сайдбаре справа.
     На мобильном — обычный стек: viewer → sidebar → info. -->
<section class="grid gap-4 lg:grid-cols-[1fr_360px]" aria-labelledby="molecule-viewer-title">
	<!-- Левая колонка: 2D/3D toggle + viewer -->
	<div class="space-y-3 lg:col-start-1 lg:row-start-1">
		{#if canUse3D && molecule}
			<div class="flex justify-end" role="radiogroup" aria-label={t('render.label')}>
				<div class="inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
					<button
						type="button"
						role="radio"
						aria-checked={mode === '3d'}
						class="rounded-md px-3 py-1 font-medium transition-colors"
						class:bg-white={mode === '3d'}
						class:shadow-sm={mode === '3d'}
						class:dark:bg-zinc-700={mode === '3d'}
						class:text-zinc-500={mode !== '3d'}
						class:dark:text-zinc-400={mode !== '3d'}
						onclick={() => (mode = '3d')}>{t('render.3d')}</button
					>
					<button
						type="button"
						role="radio"
						aria-checked={mode === '2d'}
						class="rounded-md px-3 py-1 font-medium transition-colors"
						class:bg-white={mode === '2d'}
						class:shadow-sm={mode === '2d'}
						class:dark:bg-zinc-700={mode === '2d'}
						class:text-zinc-500={mode !== '2d'}
						class:dark:text-zinc-400={mode !== '2d'}
						onclick={() => (mode = '2d')}>{t('render.2d')}</button
					>
				</div>
			</div>
		{/if}

		<div
			class="relative grid min-h-[340px] place-items-center overflow-hidden rounded-xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
		>
			{#if loading && !molecule}
				<div class="text-sm text-zinc-500" role="status">{t('molecule.loading')}</div>
			{:else if molecule}
				{#if mode === '3d' && canUse3D}
					{#key molecule.canonicalSmiles}
						<Molecule3D atoms={molecule.atoms} bonds={molecule.bonds} />
					{/key}
				{:else}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<div class="molecule-svg" aria-hidden="true">{@html molecule.svg2D}</div>
				{/if}
			{:else if error}
				<div class="text-sm text-red-600 dark:text-red-400" role="alert">
					{t('molecule.invalid')}
				</div>
			{/if}
		</div>
	</div>

	<!-- Правая sticky-колонка: библиотека + ввод SMILES.
	     На lg+ занимает обе строки и липнет к верху страницы. -->
	<aside
		class="space-y-3 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
	>
		<details
			open
			class="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800"
		>
			<summary class="cursor-pointer text-sm font-medium select-none">
				{t('molecule.library')}
			</summary>
			<div class="mt-3 max-h-[60vh] overflow-y-auto pr-1 lg:max-h-[calc(100vh-260px)]">
				<MoleculeLibrary onPick={pickFromLibrary} />
			</div>
		</details>

		<details
			class="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800"
		>
			<summary class="cursor-pointer text-sm font-medium select-none">
				{t('molecule.smiles')}
			</summary>
			<div class="mt-2">
				<input
					id="smiles-input"
					type="text"
					bind:value={input}
					placeholder={t('molecule.placeholder')}
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
				/>
			</div>
		</details>
	</aside>

	<!-- Нижняя часть левой колонки: метаданные распарсенной молекулы -->
	{#if molecule}
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm lg:col-start-1 lg:row-start-2">
			<dt class="text-zinc-600 dark:text-zinc-400">{t('molecule.formula')}</dt>
			<dd class="font-mono">{molecule.formula}</dd>
			<dt class="text-zinc-600 dark:text-zinc-400">{t('molecule.weight')}</dt>
			<dd class="font-mono">{molecule.relativeWeight.toFixed(2)}</dd>
			<dt class="text-zinc-600 dark:text-zinc-400">SMILES</dt>
			<dd class="truncate font-mono">{molecule.canonicalSmiles}</dd>
		</dl>
	{/if}
</section>

<style>
	.molecule-svg :global(svg) {
		max-width: 100%;
		height: auto;
	}
	@media (prefers-color-scheme: dark) {
		.molecule-svg {
			filter: invert(1) hue-rotate(180deg);
		}
	}
</style>
