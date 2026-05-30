// Чистая логика нагревательной плитки: маппинг уровня интенсивности в целевую температуру,
// решение о действии (heat/cool/noop) для существующего lab-state reducer, и opacity свечения
// верхней поверхности. Никакого Three.js здесь — модуль покрыт юнит-тестами и переиспользуется
// и render-слоем (heating-plate.ts), и интеграцией в VisualLabView.

/** Уровень панели плитки: 0 — выключено (комнатная T), 1/2/3 — три ступени нагрева. */
export type HeatingIntensity = 0 | 1 | 2 | 3;

/**
 * Целевые температуры (Кельвин) на каждом уровне.
 *   OFF = комнатная (298 K),
 *   I — мягкий нагрев / растворение,
 *   II — большинство школьных разложений,
 *   III — пламя / горение.
 */
export const INTENSITY_TARGETS: Readonly<Record<HeatingIntensity, number>> = {
	0: 298,
	1: 400,
	2: 700,
	3: 1100
};

/** Минимальный зазор (K) между текущей и целевой, при котором ещё имеет смысл диспетчить heat/cool. */
const ACTION_EPSILON_K = 1;

/** Целевая температура (K) для уровня интенсивности. */
export function targetTemperatureFor(intensity: HeatingIntensity): number {
	return INTENSITY_TARGETS[intensity];
}

/**
 * Какое действие нужно дать существующему `heat`/`cool` reducer, чтобы привести контейнер
 * к target T выбранного уровня. Помогает избежать пустых записей в журнале действий, когда
 * пользователь жмёт ту же кнопку повторно.
 */
export function isHeatingAction(
	intensity: HeatingIntensity,
	currentK: number
): 'heat' | 'cool' | 'noop' {
	const target = INTENSITY_TARGETS[intensity];
	if (target > currentK + ACTION_EPSILON_K) return 'heat';
	if (target < currentK - ACTION_EPSILON_K) return 'cool';
	return 'noop';
}

/** Непрозрачность красного свечения верхней поверхности плитки на текущем уровне (0..1). */
export function glowOpacityFor(intensity: HeatingIntensity): number {
	switch (intensity) {
		case 0:
			return 0;
		case 1:
			return 0.25;
		case 2:
			return 0.55;
		case 3:
			return 0.9;
	}
}
