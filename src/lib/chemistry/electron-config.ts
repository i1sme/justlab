// Распределение электронов по оболочкам (Bohr-модель).
// Используем Aufbau-порядок заполнения; для аномалий (Cu, Cr и др.) даём
// упрощённое заполнение — в школьно-вузовской визуализации это нормально.

interface Orbital {
	/** Главное квантовое число (номер оболочки) */
	n: number;
	/** Максимум электронов */
	cap: number;
}

/** Орбитали в порядке заполнения по правилу Маделунга/Aufbau. */
const FILL_ORDER: ReadonlyArray<Orbital> = [
	{ n: 1, cap: 2 }, // 1s
	{ n: 2, cap: 2 }, // 2s
	{ n: 2, cap: 6 }, // 2p
	{ n: 3, cap: 2 }, // 3s
	{ n: 3, cap: 6 }, // 3p
	{ n: 4, cap: 2 }, // 4s
	{ n: 3, cap: 10 }, // 3d
	{ n: 4, cap: 6 }, // 4p
	{ n: 5, cap: 2 }, // 5s
	{ n: 4, cap: 10 }, // 4d
	{ n: 5, cap: 6 }, // 5p
	{ n: 6, cap: 2 }, // 6s
	{ n: 4, cap: 14 }, // 4f
	{ n: 5, cap: 10 }, // 5d
	{ n: 6, cap: 6 }, // 6p
	{ n: 7, cap: 2 }, // 7s
	{ n: 5, cap: 14 }, // 5f
	{ n: 6, cap: 10 }, // 6d
	{ n: 7, cap: 6 } // 7p
];

/**
 * Кол-во электронов на каждой оболочке для атома с данным Z.
 * Например, Fe (Z=26) → [2, 8, 14, 2].
 */
export function shellDistribution(atomicNumber: number): number[] {
	const shells: number[] = [];
	let remaining = atomicNumber;
	for (const orb of FILL_ORDER) {
		if (remaining <= 0) break;
		const e = Math.min(remaining, orb.cap);
		while (shells.length < orb.n) shells.push(0);
		shells[orb.n - 1] += e;
		remaining -= e;
	}
	// Хвостовые нули отрезаем (для Z=2 не должно быть пустых оболочек выше 1).
	while (shells.length > 0 && shells[shells.length - 1] === 0) shells.pop();
	return shells;
}
