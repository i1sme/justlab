<script lang="ts">
	import { CATEGORY_COLORS, CATEGORY_ORDER } from '../../data';
	import { t } from '$lib/i18n';
</script>

<ul
	class="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-zinc-700 dark:text-zinc-300"
	aria-label={t('periodicTable.title')}
>
	{#each CATEGORY_ORDER as cat (cat)}
		<li class="flex items-center gap-1.5">
			<span
				class="h-3 w-3 flex-shrink-0 rounded-sm ring-1 ring-black/10"
				style:background-color={CATEGORY_COLORS[cat]}
				aria-hidden="true"
			></span>
			<span>{t(`category.${cat}`)}</span>
		</li>
	{/each}
</ul>
