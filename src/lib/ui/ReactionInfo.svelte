<script lang="ts">
	import { getLastReaction, getLastUnknown, getPlayback, replayLastReaction } from '$lib/lab';
	import { findSubstance } from '../../data/substances';
	import { getLocale, t } from '$lib/i18n';
	import { getEffectiveUserMode, getMotionEnabled } from '$lib/settings';
	import TermLink from './TermLink.svelte';

	const last = $derived(getLastReaction());
	const unknown = $derived(getLastUnknown());
	const locale = $derived(getLocale());
	const mode = $derived(getEffectiveUserMode());
	// Реактивно отслеживаем активный playback в контейнере последней реакции,
	// чтобы дизейблить кнопку «Повторить», пока анимация уже идёт.
	const playing = $derived(last ? getPlayback(last.containerId) !== undefined : false);
	const canReplay = $derived(!!last && getMotionEnabled() && !playing);

	function nameOf(id: string): string {
		return findSubstance(id)?.names[locale] ?? id;
	}
	function formulaOf(id: string): string {
		return findSubstance(id)?.formula ?? id;
	}
</script>

<section
	class="rounded-xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
	aria-live="polite"
>
	<header class="flex items-baseline justify-between gap-2">
		<h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
			{t('lab.reaction.label')}
		</h2>
		<div class="flex items-baseline gap-2">
			{#if last}
				<button
					type="button"
					class="replay-btn"
					disabled={!canReplay}
					onclick={() => replayLastReaction()}
					title={getMotionEnabled() ? t('lab.reaction.replay') : t('lab.reaction.replayMotionOff')}
					aria-label={t('lab.reaction.replay')}
				>
					↻ {t('lab.reaction.replay')}
				</button>
				<span class="font-mono text-[10px] text-zinc-400">→ {last.containerId}</span>
			{:else if unknown}
				<span class="font-mono text-[10px] text-zinc-400">→ {unknown.containerId}</span>
			{/if}
		</div>
	</header>

	{#if last}
		<div class="mt-2 space-y-2">
			<div class="rounded-md bg-blue-50 px-3 py-2 font-mono text-sm dark:bg-blue-900/30">
				{last.reaction.equation}
			</div>
			{#if last.reaction.inferenceSource === 'rules'}
				<!-- Честный бейдж: реакция выведена из общих правил, а не точное совпадение в БД. -->
				<div
					class="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-1 text-xs font-medium text-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
					title={t('lab.reaction.inferred.tooltip')}
				>
					<span aria-hidden="true">⚙</span>
					{t('lab.reaction.inferred.label')}
				</div>
			{/if}
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
	{:else if unknown}
		<!-- Честный ответ: реакция не нашлась в БД. CLAUDE.md: «не выдумываем продукты». -->
		<div
			class="mt-2 space-y-2 rounded-md bg-amber-50 px-3 py-2 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-900/40"
		>
			<div class="text-sm font-medium text-amber-900 dark:text-amber-200">
				{t('lab.reaction.unknown.label')}
			</div>
			<ul class="space-y-0.5 text-xs text-amber-900/90 dark:text-amber-200/90">
				{#each unknown.contents as item (item.substanceId)}
					<li class="flex items-baseline justify-between gap-2">
						<span>{nameOf(item.substanceId)}</span>
						<span class="font-mono opacity-80">
							{formulaOf(item.substanceId)} ×{item.amount}
						</span>
					</li>
				{/each}
			</ul>
			<p class="text-xs text-amber-900/80 dark:text-amber-200/80">
				{t('lab.reaction.unknown.description')}
			</p>
			{#if mode === 'beginner'}
				<p class="text-xs text-amber-900/80 italic dark:text-amber-200/80">
					{t('lab.reaction.unknown.beginnerHint')}
				</p>
			{/if}
		</div>
	{:else}
		<p class="mt-2 text-sm text-zinc-500 italic dark:text-zinc-400">
			{t('lab.reaction.none')}
		</p>
	{/if}
</section>

<style>
	.replay-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: rgb(29 78 216); /* blue-700 */
		background: rgb(219 234 254); /* blue-100 */
		transition:
			background-color 100ms ease,
			opacity 100ms ease;
	}
	.replay-btn:hover:not(:disabled) {
		background: rgb(191 219 254); /* blue-200 */
	}
	.replay-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	@media (prefers-color-scheme: dark) {
		.replay-btn {
			color: rgb(147 197 253); /* blue-300 */
			background: rgba(30, 64, 175, 0.3); /* blue-800/30 */
		}
		.replay-btn:hover:not(:disabled) {
			background: rgba(30, 64, 175, 0.5);
		}
	}
</style>
