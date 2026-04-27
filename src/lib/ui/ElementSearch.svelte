<script lang="ts">
	import { ELEMENTS, type PeriodicElement } from '../../data';
	import { getLocale, t } from '$lib/i18n';

	type Props = { onSelect?: (el: PeriodicElement) => void };
	let { onSelect }: Props = $props();

	let query = $state('');
	let highlighted = $state(0);
	let isOpen = $state(false);
	let inputEl: HTMLInputElement | null = $state(null);

	const MAX_RESULTS = 6;

	const matches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		const numQ = Number(q);
		const isNum = !Number.isNaN(numQ) && q !== '';
		const locale = getLocale();
		const out: PeriodicElement[] = [];
		for (const el of ELEMENTS) {
			let matched = false;
			if (isNum && String(el.number).startsWith(q)) matched = true;
			else if (el.symbol.toLowerCase().startsWith(q)) matched = true;
			else if (el.name[locale].toLowerCase().includes(q)) matched = true;
			else if (locale !== 'en' && el.name.en.toLowerCase().includes(q)) matched = true;
			if (matched) {
				out.push(el);
				if (out.length >= MAX_RESULTS) break;
			}
		}
		return out;
	});

	$effect(() => {
		// при смене запроса откатываем подсветку на первый вариант;
		// явное чтение `query` создаёт реактивную зависимость
		if (query !== undefined) highlighted = 0;
	});

	function pick(el: PeriodicElement): void {
		onSelect?.(el);
		query = '';
		isOpen = false;
		inputEl?.blur();
	}

	function onKeydown(e: KeyboardEvent): void {
		if (matches.length === 0) {
			if (e.key === 'Escape') isOpen = false;
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlighted = (highlighted + 1) % matches.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlighted = (highlighted - 1 + matches.length) % matches.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const m = matches[highlighted];
			if (m) pick(m);
		} else if (e.key === 'Escape') {
			isOpen = false;
		}
	}
</script>

<div class="relative">
	<input
		bind:this={inputEl}
		type="search"
		placeholder={t('search.placeholder')}
		bind:value={query}
		onfocus={() => (isOpen = true)}
		onkeydown={onKeydown}
		role="combobox"
		aria-expanded={isOpen && matches.length > 0}
		aria-controls="element-search-listbox"
		aria-autocomplete="list"
		class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
	/>

	{#if isOpen && query.trim() && matches.length === 0}
		<div
			class="absolute right-0 left-0 z-20 mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			{t('search.empty')}
		</div>
	{/if}

	{#if isOpen && matches.length > 0}
		<ul
			id="element-search-listbox"
			class="absolute right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
			role="listbox"
		>
			{#each matches as m, i (m.number)}
				<li role="option" aria-selected={i === highlighted}>
					<button
						type="button"
						tabindex="-1"
						class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm"
						class:bg-blue-50={i === highlighted}
						class:dark:bg-blue-900={i === highlighted}
						onmousedown={(e) => e.preventDefault()}
						onmouseenter={() => (highlighted = i)}
						onclick={() => pick(m)}
					>
						<span
							class="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 dark:text-zinc-400 dark:ring-zinc-700"
						>
							{m.number}
						</span>
						<span class="w-8 font-bold">{m.symbol}</span>
						<span class="truncate text-zinc-700 dark:text-zinc-300">{m.name[getLocale()]}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<svelte:window
	onclick={(e) => {
		// клик вне инпута и dropdown — закрываем
		if (!inputEl) return;
		const target = e.target as Node;
		if (target !== inputEl && !inputEl.parentElement?.contains(target)) {
			isOpen = false;
		}
	}}
/>
