// Чистая геометрия посуды: профиль стенки (для LatheGeometry) и размеры жидкости.
// Никакого three здесь — только числа, чтобы покрыть юнит-тестами (render отделён от логики).
// Форма — это ДАННЫЕ (параметр kind), не подкласс. См. roadmap-spec, принцип «данные + контракт».

import type { ContainerKind } from '../../data/types';

/** Точка профиля стенки: r — радиус от оси, y — высота от дна. Координаты в сцена-юнитах. */
export interface ProfilePoint {
	r: number;
	y: number;
}

/** Толщина стенки сосуда — вычитается из внешнего радиуса для расчёта внутреннего радиуса под жидкость. */
export const WALL_THICKNESS = 0.012;

/** Доля высоты, до которой наливаем максимум (оставляем место у края). */
const FILL_HEADROOM = 0.9;

/**
 * Профиль внешней стенки сосуда для THREE.LatheGeometry.
 * Первая точка на оси (r=0) — при вращении даёт закрытое дно; верх открыт (последняя точка r>0).
 */
export function glasswareProfile(kind: ContainerKind): ProfilePoint[] {
	switch (kind) {
		case 'beaker':
			// Прямой цилиндр с лёгким носиком-сливом.
			return [
				{ r: 0, y: 0 },
				{ r: 0.18, y: 0 },
				{ r: 0.18, y: 0.32 },
				{ r: 0.19, y: 0.34 }
			];
		case 'flask':
			// Коническая колба Эрленмейера: широкое основание → узкое горло.
			return [
				{ r: 0, y: 0 },
				{ r: 0.22, y: 0 },
				{ r: 0.22, y: 0.06 },
				{ r: 0.07, y: 0.3 },
				{ r: 0.06, y: 0.3 },
				{ r: 0.06, y: 0.42 }
			];
		case 'test-tube':
			// Узкий цилиндр со скруглённым дном.
			return [
				{ r: 0, y: 0 },
				{ r: 0.035, y: 0.006 },
				{ r: 0.06, y: 0.025 },
				{ r: 0.07, y: 0.06 },
				{ r: 0.07, y: 0.46 }
			];
		case 'crucible':
			// Приземистый усечённый конус, расширяющийся кверху.
			return [
				{ r: 0, y: 0 },
				{ r: 0.1, y: 0 },
				{ r: 0.16, y: 0.18 }
			];
		case 'petri':
			// Очень низкая широкая чашка.
			return [
				{ r: 0, y: 0 },
				{ r: 0.26, y: 0 },
				{ r: 0.26, y: 0.06 }
			];
	}
}

/** Полная высота сосуда (максимальный y профиля). */
export function glasswareHeight(kind: ContainerKind): number {
	return glasswareProfile(kind).reduce((max, p) => Math.max(max, p.y), 0);
}

/** Внешний радиус стенки на высоте y (линейная интерполяция по профилю). */
export function radiusAtHeight(kind: ContainerKind, y: number): number {
	const pts = glasswareProfile(kind);
	if (y <= pts[0].y) return pts[0].r;
	for (let i = 1; i < pts.length; i++) {
		if (y <= pts[i].y) {
			const a = pts[i - 1];
			const b = pts[i];
			const span = b.y - a.y;
			if (span <= 0) return b.r;
			const t = (y - a.y) / span;
			return a.r + (b.r - a.r) * t;
		}
	}
	return pts[pts.length - 1].r;
}

/** Внутренний радиус (под жидкость) на высоте y: внешний минус толщина стенки, не ниже 0. */
export function interiorRadiusAt(kind: ContainerKind, y: number): number {
	return Math.max(0, radiusAtHeight(kind, y) - WALL_THICKNESS);
}

/** Высота поверхности жидкости при заполнении fillRatio (0..1, клампится). */
export function liquidFillHeight(kind: ContainerKind, fillRatio: number): number {
	const clamped = Math.max(0, Math.min(1, fillRatio));
	return glasswareHeight(kind) * FILL_HEADROOM * clamped;
}

/**
 * Безопасный радиус цилиндра-жидкости: наибольший, при котором столб высотой fillH
 * не выходит за внутреннюю стенку ни на одной высоте. Профиль кусочно-линейный, поэтому
 * минимум внутреннего радиуса достигается в вершине профиля или на конце отрезка —
 * проверяем и то, и другое (нижний конец сдвинут чуть выше 0, чтобы не брать осевую точку r=0).
 * Нижние концы отрезков важны для сосудов, расширяющихся кверху (тигель): там самое узкое
 * место — у дна, и без этой проверки цилиндр протыкал бы стенку снизу. Побочный эффект: у
 * сосудов с дном, поднимающимся от оси (пробирка), радиус схлопывается к 0 — в рендере он
 * клампится до видимого минимума.
 */
export function liquidRadius(kind: ContainerKind, fillH: number): number {
	if (fillH <= 0) return 0;
	let minR = interiorRadiusAt(kind, fillH); // у поверхности жидкости
	const pts = glasswareProfile(kind);
	// Проверяем все вершины профиля с y > 0 в диапазоне [0, fillH].
	for (const p of pts) {
		if (p.y > 0 && p.y <= fillH) {
			minR = Math.min(minR, interiorRadiusAt(kind, p.y));
		}
	}
	// Проверяем нижние концы отрезков (где профиль может быть ещё уже, чем в ближайшей вершине).
	for (let i = 0; i + 1 < pts.length; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		if (b.y <= 0 || a.y >= fillH) continue;
		// Нижний конец отрезка (сдвинут чуть выше 0, чтобы не захватить осевую точку r=0).
		const yLow = Math.max(a.y, 1e-6);
		const span = b.y - a.y;
		const rLow = span > 0 ? a.r + (b.r - a.r) * ((yLow - a.y) / span) : b.r;
		minR = Math.min(minR, Math.max(0, rLow - WALL_THICKNESS));
	}
	return Math.max(0, minR);
}

/** Силуэт сосуда в SVG: симметричный замкнутый путь + размер в пикселях. */
export interface GlasswareSilhouette {
	/** SVG-атрибут `d`: контур сосуда (право-низ → верх → лево-низ → Z). */
	path: string;
	/** Полная ширина bbox в пикселях (2 × максимальный радиус × pxPerUnit). */
	widthPx: number;
	/** Полная высота bbox в пикселях (высота профиля × pxPerUnit). */
	heightPx: number;
}

/**
 * Построить силуэт сосуда для 2.5D-рендера. Профиль (r, y) зеркалится через вертикальную ось,
 * y инвертируется (в SVG ось Y растёт вниз). Результат — замкнутый путь, который можно
 * залить (стекло) и использовать как clipPath для жидкости.
 */
export function glasswareSilhouette(kind: ContainerKind, pxPerUnit: number): GlasswareSilhouette {
	const pts = glasswareProfile(kind);
	const heightUnits = glasswareHeight(kind);
	const maxR = pts.reduce((m, p) => Math.max(m, p.r), 0);
	const widthPx = maxR * 2 * pxPerUnit;
	const heightPx = heightUnits * pxPerUnit;
	const cx = widthPx / 2;
	const sx = (r: number): string => (cx + r * pxPerUnit).toFixed(2);
	const sy = (y: number): string => ((heightUnits - y) * pxPerUnit).toFixed(2);

	// Старт в нижней точке оси, проход вверх по правой стороне.
	let d = `M ${sx(0)} ${sy(0)}`;
	for (const p of pts) d += ` L ${sx(p.r)} ${sy(p.y)}`;
	// Возврат вниз по левой стороне (зеркало), сверху вниз.
	for (let i = pts.length - 1; i >= 0; i--) d += ` L ${sx(-pts[i].r)} ${sy(pts[i].y)}`;
	d += ' Z';

	return { path: d, widthPx, heightPx };
}
