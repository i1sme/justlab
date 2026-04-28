<script lang="ts">
	import { getUserMode, setUserMode, type UserMode } from '$lib/settings';
	import { t } from '$lib/i18n';

	type Props = {
		/** Bindable: parent open/closes. */
		open?: boolean;
	};
	let { open = $bindable(false) }: Props = $props();

	let dialog: HTMLDialogElement | null = $state(null);

	// Синхронизация state ↔ dialog API.
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	function pick(mode: UserMode): void {
		setUserMode(mode);
		open = false;
	}

	// Если пользователь закрыл (X / ESC / клик по backdrop) без выбора — ставим school как разумный дефолт.
	function onDialogClose(): void {
		open = false;
		if (getUserMode() === null) setUserMode('school');
	}

	const modes: ReadonlyArray<{ id: UserMode; emoji: string }> = [
		{ id: 'beginner', emoji: '🌱' },
		{ id: 'school', emoji: '🏫' },
		{ id: 'university', emoji: '🎓' }
	];
</script>

<dialog
	bind:this={dialog}
	onclose={onDialogClose}
	class="m-auto w-[min(92vw,720px)] rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-900/60 dark:bg-zinc-900"
	aria-labelledby="wizard-title"
>
	<div
		class="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800"
	>
		<div>
			<h2 id="wizard-title" class="text-xl font-bold tracking-tight">{t('wizard.title')}</h2>
			<p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{t('wizard.subtitle')}</p>
		</div>
		<button
			type="button"
			class="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
			aria-label={t('wizard.close')}
			onclick={() => (open = false)}
		>
			<svg viewBox="0 0 16 16" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7">
				<path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" />
			</svg>
		</button>
	</div>

	<div class="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
		{#each modes as mode (mode.id)}
			{@const isCurrent = getUserMode() === mode.id}
			<button
				type="button"
				class="mode-card {isCurrent ? 'mode-card-current' : 'mode-card-default'}"
				onclick={() => pick(mode.id)}
				aria-pressed={isCurrent}
			>
				<span class="text-3xl" aria-hidden="true">{mode.emoji}</span>
				<h3 class="text-base font-semibold">
					{t(`wizard.modes.${mode.id}.title`)}
				</h3>
				<p class="text-sm text-zinc-700 dark:text-zinc-300">
					{t(`wizard.modes.${mode.id}.description`)}
				</p>
			</button>
		{/each}
	</div>

	<div
		class="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
	>
		{t('wizard.changeAnytime')}
	</div>
</dialog>

<style>
	.mode-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 0.75rem;
		border-width: 2px;
		text-align: left;
		transition: all 150ms ease;
	}
	.mode-card:hover {
		transform: scale(1.02);
		border-color: #3b82f6;
		background-color: #eff6ff;
	}
	.mode-card:focus-visible {
		outline: none;
		border-color: #3b82f6;
	}
	@media (prefers-color-scheme: dark) {
		.mode-card:hover {
			background-color: rgba(30, 58, 138, 0.3);
		}
	}
	.mode-card-current {
		border-color: #3b82f6;
		background-color: #eff6ff;
	}
	@media (prefers-color-scheme: dark) {
		.mode-card-current {
			background-color: rgba(30, 58, 138, 0.3);
		}
	}
	.mode-card-default {
		border-color: rgb(228 228 231); /* zinc-200 */
	}
	@media (prefers-color-scheme: dark) {
		.mode-card-default {
			border-color: rgb(63 63 70); /* zinc-700 */
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mode-card {
			transition: none;
		}
		.mode-card:hover {
			transform: none;
		}
	}
</style>
