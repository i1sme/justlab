<script lang="ts">
	import { getEffectiveUserMode } from '$lib/settings';
	import { t } from '$lib/i18n';

	type Props = { onClick: () => void };
	let { onClick }: Props = $props();

	// Иконка-«шапочка выпускника» для всех режимов: визуально означает «настройка уровня».
	const currentLabel = $derived(t(`userMode.${getEffectiveUserMode()}`));
</script>

<button
	type="button"
	class="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
	aria-label={t('userMode.open')}
	title={t('userMode.current').replace('{mode}', currentLabel)}
	onclick={onClick}
>
	<!-- Mortarboard / graduation cap -->
	<svg viewBox="0 0 20 20" class="h-5 w-5" fill="currentColor" aria-hidden="true">
		<path
			d="M10 3 1 7l9 4 7-3.1V13h1.5V7L10 3Zm0 9.5-6.5-2.9V12c0 1.5 2.9 2.7 6.5 2.7s6.5-1.2 6.5-2.7V9.6L10 12.5Z"
		/>
	</svg>
</button>
