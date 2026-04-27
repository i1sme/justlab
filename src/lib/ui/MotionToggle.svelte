<script lang="ts">
	import { getMotionEnabled, toggleMotion } from '$lib/settings';
	import { t } from '$lib/i18n';
</script>

<button
	type="button"
	class="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
	aria-label={getMotionEnabled() ? t('motion.on') : t('motion.off')}
	aria-pressed={getMotionEnabled()}
	title={t('motion.label')}
	onclick={toggleMotion}
>
	{#if getMotionEnabled()}
		<!-- Иконка играющей анимации (точки в движении) -->
		<svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.7">
			<circle cx="4" cy="10" r="1.6" fill="currentColor" />
			<circle cx="10" cy="10" r="1.6" fill="currentColor" opacity="0.6" />
			<circle cx="16" cy="10" r="1.6" fill="currentColor" opacity="0.3" />
		</svg>
	{:else}
		<!-- Иконка паузы -->
		<svg viewBox="0 0 20 20" class="h-5 w-5" fill="currentColor">
			<rect x="5" y="4" width="3.5" height="12" rx="1" />
			<rect x="11.5" y="4" width="3.5" height="12" rx="1" />
		</svg>
	{/if}
</button>
