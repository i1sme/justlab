<script lang="ts">
	import { t } from '$lib/i18n';

	type Props = {
		onZoomIn: () => void;
		onZoomOut: () => void;
		onFullscreen: () => void;
		onToggleCollapse: () => void;
		isFullscreen?: boolean;
		collapsed?: boolean;
		canZoomIn?: boolean;
		canZoomOut?: boolean;
	};

	let {
		onZoomIn,
		onZoomOut,
		onFullscreen,
		onToggleCollapse,
		isFullscreen = false,
		collapsed = false,
		canZoomIn = true,
		canZoomOut = true
	}: Props = $props();
</script>

<div
	class="inline-flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
>
	<button
		type="button"
		class="grid h-7 w-7 place-items-center rounded-md transition-colors enabled:hover:bg-white disabled:opacity-40 dark:enabled:hover:bg-zinc-700"
		aria-label={t('viewer.zoomOut')}
		title={t('viewer.zoomOut')}
		disabled={!canZoomOut || collapsed}
		onclick={onZoomOut}
	>
		<svg viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
			<rect x="3" y="7.25" width="10" height="1.5" rx="0.5" />
		</svg>
	</button>
	<button
		type="button"
		class="grid h-7 w-7 place-items-center rounded-md transition-colors enabled:hover:bg-white disabled:opacity-40 dark:enabled:hover:bg-zinc-700"
		aria-label={t('viewer.zoomIn')}
		title={t('viewer.zoomIn')}
		disabled={!canZoomIn || collapsed}
		onclick={onZoomIn}
	>
		<svg viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
			<rect x="3" y="7.25" width="10" height="1.5" rx="0.5" />
			<rect x="7.25" y="3" width="1.5" height="10" rx="0.5" />
		</svg>
	</button>

	<span class="mx-0.5 h-4 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true"></span>

	<button
		type="button"
		class="grid h-7 w-7 place-items-center rounded-md transition-colors enabled:hover:bg-white disabled:opacity-40 dark:enabled:hover:bg-zinc-700"
		aria-label={isFullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
		title={isFullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
		aria-pressed={isFullscreen}
		disabled={collapsed}
		onclick={onFullscreen}
	>
		{#if isFullscreen}
			<!-- Углы внутрь = выход из полноэкранного -->
			<svg
				viewBox="0 0 16 16"
				class="h-4 w-4"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M6 3v3H3" />
				<path d="M10 3v3h3" />
				<path d="M6 13v-3H3" />
				<path d="M10 13v-3h3" />
			</svg>
		{:else}
			<!-- Углы наружу = вход -->
			<svg
				viewBox="0 0 16 16"
				class="h-4 w-4"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M3 6V3h3" />
				<path d="M13 6V3h-3" />
				<path d="M3 10v3h3" />
				<path d="M13 10v3h-3" />
			</svg>
		{/if}
	</button>
	<button
		type="button"
		class="grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-white dark:hover:bg-zinc-700"
		aria-label={collapsed ? t('viewer.expand') : t('viewer.collapse')}
		title={collapsed ? t('viewer.expand') : t('viewer.collapse')}
		aria-pressed={collapsed}
		onclick={onToggleCollapse}
	>
		<svg
			viewBox="0 0 16 16"
			class="h-4 w-4 transition-transform"
			class:rotate-180={collapsed}
			fill="none"
			stroke="currentColor"
			stroke-width="1.7"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M4 10l4-4 4 4" />
		</svg>
	</button>
</div>
