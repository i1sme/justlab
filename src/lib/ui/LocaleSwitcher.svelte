<script lang="ts">
	import { getLocale, setLocale, SUPPORTED_LOCALES, type Locale } from '$lib/i18n';

	const labels: Record<Locale, string> = { ru: 'RU', en: 'EN' };
</script>

<div
	class="inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-800"
	role="radiogroup"
	aria-label="Language"
>
	{#each SUPPORTED_LOCALES as locale (locale)}
		{@const active = getLocale() === locale}
		<button
			type="button"
			role="radio"
			aria-checked={active}
			aria-label={labels[locale]}
			class="rounded-md px-2.5 py-1 font-medium transition-colors"
			class:bg-white={active}
			class:shadow-sm={active}
			class:dark:bg-zinc-700={active}
			class:text-zinc-500={!active}
			class:dark:text-zinc-400={!active}
			onclick={() => setLocale(locale)}>{labels[locale]}</button
		>
	{/each}
</div>
