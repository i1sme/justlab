<script lang="ts">
	import { getLastReaction } from '$lib/lab';
	import { getLocale, t } from '$lib/i18n';
	import TermLink from './TermLink.svelte';

	const last = $derived(getLastReaction());
	const locale = $derived(getLocale());
</script>

<section
	class="rounded-xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
	aria-live="polite"
>
	<header class="flex items-baseline justify-between gap-2">
		<h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
			{t('lab.reaction.label')}
		</h2>
		{#if last}
			<span class="font-mono text-[10px] text-zinc-400">→ {last.containerId}</span>
		{/if}
	</header>

	{#if last}
		<div class="mt-2 space-y-2">
			<div class="rounded-md bg-blue-50 px-3 py-2 font-mono text-sm dark:bg-blue-900/30">
				{last.reaction.equation}
			</div>
			<p class="text-sm text-zinc-700 dark:text-zinc-300">
				{last.reaction.description[locale]}
			</p>
			{#if last.reaction.glossaryRefs && last.reaction.glossaryRefs.length > 0}
				<div class="flex flex-wrap gap-1.5 pt-1 text-xs">
					{#each last.reaction.glossaryRefs as termKey (termKey)}
						<TermLink {termKey}>{termKey}</TermLink>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<p class="mt-2 text-sm text-zinc-500 italic dark:text-zinc-400">
			{t('lab.reaction.none')}
		</p>
	{/if}
</section>
