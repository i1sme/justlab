<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { GLOSSARY } from '../../data';
	import { getLocale } from '$lib/i18n';

	type Props = {
		termKey: string;
		children: Snippet;
	};

	let { termKey, children }: Props = $props();

	const term = $derived(GLOSSARY.find((g) => g.key === termKey));
	const tooltip = $derived(term ? term.definition[getLocale()] : '');
</script>

{#if term}
	<a
		href={resolve('/glossary') + '#term-' + termKey}
		title={tooltip}
		class="cursor-help border-b border-dotted border-zinc-400 transition-colors hover:border-blue-600 hover:text-blue-700 focus-visible:border-blue-600 focus-visible:text-blue-700 focus-visible:outline-none dark:border-zinc-500 dark:hover:border-blue-400 dark:hover:text-blue-400 dark:focus-visible:border-blue-400 dark:focus-visible:text-blue-400"
	>
		{@render children()}
	</a>
{:else}
	{@render children()}
{/if}
