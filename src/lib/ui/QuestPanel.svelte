<script lang="ts">
	// Панель квестов: активная цель + список доступных + индикатор выполнения.
	//
	// Видна при userMode = beginner | school. В university-режиме скрыта,
	// студентам микроцели не нужны (для них есть полная свобода эксперимента).

	import { QUESTS } from '../../data/quests';
	import {
		getActiveQuest,
		getActiveQuestId,
		getCompletedQuestIds,
		getJustCompletedId,
		clearJustCompleted,
		setActiveQuest,
		isQuestCompleted
	} from '$lib/lab';
	import { getLocale, t } from '$lib/i18n';
	import { getEffectiveUserMode, isVisibleAtMode } from '$lib/settings';

	const locale = $derived(getLocale());
	const mode = $derived(getEffectiveUserMode());
	const active = $derived(getActiveQuest());
	const activeId = $derived(getActiveQuestId());
	const completedIds = $derived(getCompletedQuestIds());
	const justCompleted = $derived(getJustCompletedId());

	const visibleQuests = $derived(QUESTS.filter((q) => isVisibleAtMode(q.difficulty, mode)));
	const completedCount = $derived(visibleQuests.filter((q) => completedIds.includes(q.id)).length);

	let showHint = $state(false);

	function pick(id: string): void {
		setActiveQuest(id === activeId ? null : id);
		showHint = false;
	}

	function categoryIcon(cat: string): string {
		switch (cat) {
			case 'salt':
				return '🧂';
			case 'precipitate':
				return '⬇';
			case 'gas':
				return '💨';
			case 'flame':
				return '🔥';
			case 'combustion':
				return '✨';
			default:
				return '·';
		}
	}
</script>

{#if mode !== 'university' && visibleQuests.length > 0}
	<section
		class="rounded-xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
		aria-labelledby="quest-panel-title"
	>
		<header class="flex items-baseline justify-between gap-2">
			<h2 id="quest-panel-title" class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
				{t('lab.quests.label')}
			</h2>
			<span class="font-mono text-[10px] text-zinc-400">
				{completedCount} / {visibleQuests.length}
			</span>
		</header>

		{#if justCompleted}
			<!-- Toast выполненного квеста: пользователь увидит и сам закроет. -->
			<div
				class="mt-2 flex items-baseline justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-900/50"
				role="status"
			>
				<span class="text-sm text-emerald-900 dark:text-emerald-200">
					✓ {t('lab.quests.justCompleted')}
				</span>
				<button
					type="button"
					class="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300"
					onclick={() => clearJustCompleted()}
				>
					{t('lab.quests.dismiss')}
				</button>
			</div>
		{/if}

		{#if active}
			<div class="mt-2 space-y-2">
				<div class="text-sm font-medium text-zinc-800 dark:text-zinc-200">
					{categoryIcon(active.category)}
					{active.title[locale]}
				</div>
				<p class="text-xs text-zinc-700 dark:text-zinc-300">
					{active.description[locale]}
				</p>
				{#if active.hint}
					<button
						type="button"
						class="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
						onclick={() => (showHint = !showHint)}
					>
						{showHint ? t('lab.quests.hideHint') : t('lab.quests.showHint')}
					</button>
					{#if showHint}
						<p class="text-xs text-zinc-600 italic dark:text-zinc-400">
							{active.hint[locale]}
						</p>
					{/if}
				{/if}
			</div>
		{:else}
			<p class="mt-2 text-xs text-zinc-500 italic dark:text-zinc-400">
				{t('lab.quests.pickOne')}
			</p>
		{/if}

		<details class="group mt-3">
			<summary
				class="flex cursor-pointer items-center justify-between text-xs font-semibold tracking-wide text-zinc-500 uppercase select-none dark:text-zinc-400"
			>
				<span>{t('lab.quests.allLabel')}</span>
				<span class="font-mono text-[10px] opacity-60">{visibleQuests.length}</span>
			</summary>
			<ul class="mt-1.5 space-y-1">
				{#each visibleQuests as q (q.id)}
					{@const done = isQuestCompleted(q.id)}
					{@const isActive = q.id === activeId}
					<li>
						<button
							type="button"
							class="quest-item"
							class:quest-item--active={isActive}
							class:quest-item--done={done}
							onclick={() => pick(q.id)}
						>
							<span class="flex min-w-0 items-center gap-1.5">
								<span aria-hidden="true">{categoryIcon(q.category)}</span>
								<span class="truncate">{q.title[locale]}</span>
							</span>
							<span class="flex-shrink-0">
								{#if done}
									<span
										class="text-emerald-600 dark:text-emerald-400"
										aria-label={t('lab.quests.completed')}>✓</span
									>
								{:else if isActive}
									<span class="text-blue-600 dark:text-blue-400" aria-label={t('lab.quests.active')}
										>●</span
									>
								{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		</details>
	</section>
{/if}

<style>
	.quest-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.8rem;
		text-align: left;
		color: rgb(63 63 70); /* zinc-700 */
		background: rgb(244 244 245); /* zinc-100 */
		transition: background-color 100ms ease;
	}
	.quest-item:hover {
		background: rgb(228 228 231); /* zinc-200 */
	}
	.quest-item--active {
		background: rgb(219 234 254); /* blue-100 */
		color: rgb(29 78 216); /* blue-700 */
	}
	.quest-item--active:hover {
		background: rgb(191 219 254); /* blue-200 */
	}
	.quest-item--done {
		opacity: 0.85;
	}
	@media (prefers-color-scheme: dark) {
		.quest-item {
			color: rgb(212 212 216); /* zinc-300 */
			background: rgb(39 39 42); /* zinc-800 */
		}
		.quest-item:hover {
			background: rgb(63 63 70); /* zinc-700 */
		}
		.quest-item--active {
			background: rgba(30, 64, 175, 0.3); /* blue-800/30 */
			color: rgb(147 197 253); /* blue-300 */
		}
		.quest-item--active:hover {
			background: rgba(30, 64, 175, 0.5);
		}
	}
</style>
