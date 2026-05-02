<script lang="ts">
	// Тулбар управления посудой на столе: добавить колбу выбранного типа.
	// Виден в обоих режимах — formal/visual — состояние общее.
	// Удаление и очистка живут в карточке/3D-overlay соответственно.

	import type { ContainerKind } from '../../data/types';
	import { addContainer, getExperiment } from '$lib/lab';
	import { t } from '$lib/i18n';

	const KINDS: readonly ContainerKind[] = ['beaker', 'test-tube', 'flask', 'crucible', 'petri'];

	const containers = $derived(getExperiment().containers);

	let pickerOpen = $state(false);

	function onPick(kind: ContainerKind): void {
		addContainer(kind);
		pickerOpen = false;
	}

	function onToggle(): void {
		pickerOpen = !pickerOpen;
	}

	function onBackdropClick(): void {
		pickerOpen = false;
	}
</script>

<div class="ct-row">
	<span class="ct-count">
		{t('lab.containers')}: {containers.length}
	</span>
	<div class="ct-picker">
		<button
			type="button"
			class="ct-add-btn"
			aria-haspopup="menu"
			aria-expanded={pickerOpen}
			onclick={onToggle}
		>
			+ {t('lab.addContainer')}
		</button>
		{#if pickerOpen}
			<button
				class="ct-backdrop"
				type="button"
				aria-label={t('lab.closeMenu')}
				onclick={onBackdropClick}
			></button>
			<ul class="ct-menu" role="menu">
				{#each KINDS as kind (kind)}
					<li>
						<button type="button" role="menuitem" class="ct-menu-item" onclick={() => onPick(kind)}>
							{t(`lab.containerKind.${kind}`)}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.ct-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.ct-count {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		color: rgb(113 113 122); /* zinc-500 */
	}
	@media (prefers-color-scheme: dark) {
		.ct-count {
			color: rgb(161 161 170); /* zinc-400 */
		}
	}
	.ct-picker {
		position: relative;
	}
	.ct-add-btn {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.3rem 0.7rem;
		border-radius: 0.375rem;
		border: 1px solid rgb(228 228 231);
		background: rgb(255 255 255);
		color: rgb(63 63 70);
		transition: background-color 100ms ease;
	}
	.ct-add-btn:hover {
		background: rgb(244 244 245);
	}
	@media (prefers-color-scheme: dark) {
		.ct-add-btn {
			background: rgb(24 24 27);
			border-color: rgb(63 63 70);
			color: rgb(212 212 216);
		}
		.ct-add-btn:hover {
			background: rgb(39 39 42);
		}
	}
	.ct-backdrop {
		position: fixed;
		inset: 0;
		background: transparent;
		z-index: 19;
		cursor: default;
	}
	.ct-menu {
		position: absolute;
		top: calc(100% + 0.25rem);
		right: 0;
		min-width: 9rem;
		background: rgb(255 255 255);
		border: 1px solid rgb(228 228 231);
		border-radius: 0.5rem;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
		z-index: 20;
		padding: 0.25rem;
	}
	@media (prefers-color-scheme: dark) {
		.ct-menu {
			background: rgb(24 24 27);
			border-color: rgb(63 63 70);
			box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
		}
	}
	.ct-menu-item {
		display: block;
		width: 100%;
		padding: 0.4rem 0.6rem;
		border-radius: 0.375rem;
		font-size: 0.8rem;
		text-align: left;
		color: rgb(63 63 70);
	}
	.ct-menu-item:hover {
		background: rgb(244 244 245);
	}
	@media (prefers-color-scheme: dark) {
		.ct-menu-item {
			color: rgb(212 212 216);
		}
		.ct-menu-item:hover {
			background: rgb(39 39 42);
		}
	}
</style>
