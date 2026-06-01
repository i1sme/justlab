<script module lang="ts">
	// Счётчик инстансов для уникального clipPath id (один и тот же контейнер может
	// рендериться дважды: миниатюра на полке + крупно в рабочей зоне).
	let _seq = 0;
	function nextGlasswareUid(): number {
		return ++_seq;
	}
</script>

<script lang="ts">
	// Один сосуд как SVG-силуэт + залитая жидкость (clip-mask по контуру).
	// Цвет жидкости — научно достоверный, из Substance.phases[phase].color.
	// Чистая геометрия силуэта — в render2d/glassware-profiles.ts (покрыта тестами).

	import type { Container } from '../../../data/types';
	import { findSubstance } from '../../../data/substances';
	import { t } from '$lib/i18n';
	import {
		glasswareSilhouette,
		glasswareProfile,
		glasswareHeight,
		liquidFillHeight
	} from '$lib/render2d/glassware-profiles';

	type Props = {
		container: Container;
		/** Высота рендера в пикселях; ширина выводится из пропорций сосуда. */
		heightPx?: number;
	};
	let { container, heightPx = 280 }: Props = $props();

	const _uid = nextGlasswareUid();

	// pxPerUnit подбирается так, чтобы сосуд занял заданную высоту.
	const pxPerUnit = $derived(heightPx / glasswareHeight(container.kind));
	const silo = $derived(glasswareSilhouette(container.kind, pxPerUnit));
	const clipId = $derived(`glass-clip-${container.id}-${_uid}`);

	const total = $derived(container.contents.reduce((s, x) => s + x.amount, 0));
	const fillRatio = $derived(Math.min(1, total / 4));
	const fillPx = $derived(liquidFillHeight(container.kind, fillRatio) * pxPerUnit);

	const liquidColor = $derived.by(() => {
		if (container.contents.length === 0) return null;
		const top = container.contents[container.contents.length - 1];
		const sub = findSubstance(top.substanceId);
		return sub?.phases[top.phase]?.color ?? '#a8c8e8';
	});

	// Радиус устья (верхнего отверстия) = радиус последней точки профиля × pxPerUnit.
	// Именно устье, а не максимальный радиус сосуда — иначе у колбы ободок «вылезет» за узкое горло.
	const rimRx = $derived.by(() => {
		const pts = glasswareProfile(container.kind);
		return pts[pts.length - 1].r * pxPerUnit;
	});

	// Вертикальный радиус устья — доля от горизонтального: даёт эллипс-«отверстие» в 2.5D.
	const rimRy = $derived(Math.max(1.5, rimRx * 0.18));
</script>

<svg
	class="glassware"
	width={silo.widthPx}
	height={silo.heightPx}
	viewBox="0 0 {silo.widthPx} {silo.heightPx}"
	role="img"
	aria-label={t(`lab.containerKind.${container.kind}`)}
>
	<defs>
		<clipPath id={clipId}>
			<path d={silo.path} />
		</clipPath>
	</defs>

	<!-- Жидкость: прямоугольник снизу, обрезанный по контуру сосуда. -->
	{#if liquidColor && fillPx > 0}
		<rect
			x="0"
			y={silo.heightPx - fillPx}
			width={silo.widthPx}
			height={fillPx}
			fill={liquidColor}
			opacity="0.85"
			clip-path="url(#{clipId})"
		/>
	{/if}

	<!-- Стекло: тело сосуда (заливка + контур). -->
	<path
		d={silo.path}
		fill="var(--lab-glass-fill, rgba(220,234,242,0.25))"
		stroke="var(--lab-glass-stroke, #a8b8c3)"
		stroke-width="2"
		stroke-linejoin="round"
	/>

	<!-- Ободок открытого верха: тонкий эллипс, чтобы сосуд не читался как закрытая банка. -->
	<ellipse
		cx={silo.widthPx / 2}
		cy={rimRy}
		rx={Math.max(2, rimRx)}
		ry={rimRy}
		fill="none"
		stroke="var(--lab-glass-stroke, #a8b8c3)"
		stroke-width="2"
		opacity="0.85"
	/>
</svg>

<style>
	.glassware {
		display: block;
		overflow: visible;
	}
</style>
