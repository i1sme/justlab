// Чистая геометрия посуды: профиль стенки (для LatheGeometry) и размеры жидкости.
// Никакого three здесь — только числа, чтобы покрыть юнит-тестами (render отделён от логики).
// Форма — это ДАННЫЕ (параметр kind), не подкласс. См. roadmap-spec, принцип «данные + контракт».

import type { ContainerKind } from '../../data/types';

/** Точка профиля стенки: r — радиус от оси, y — высота от дна. Координаты в сцена-юнитах. */
export interface ProfilePoint {
	r: number;
	y: number;
}

/** Толщина стенки сосуда — вычитается из внешнего радиуса для расчёта объёма жидкости. */
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
