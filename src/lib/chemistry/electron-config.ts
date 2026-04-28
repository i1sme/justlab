// Распределение электронов по оболочкам (Bohr-модель).
// Базовый расчёт — Aufbau-порядок заполнения. Для известных аномалий
// (Cu, Cr, Pd и др. — где один s-электрон проваливается в d-оболочку,
// или у лантаноидов/актиноидов отдельные конфигурации) применяем patch-таблицу.

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
 * Известные отклонения от Aufbau (распределение по K..Q оболочкам).
 * Источник: NIST / IUPAC standard electron configurations.
 */
const ANOMALIES: Readonly<Record<number, readonly number[]>> = {
	// d-блок: один 4s/5s/6s электрон проваливается в (n−1)d
	24: [2, 8, 13, 1], // Cr  [Ar] 3d⁵ 4s¹
	29: [2, 8, 18, 1], // Cu  [Ar] 3d¹⁰ 4s¹
	41: [2, 8, 18, 12, 1], // Nb  [Kr] 4d⁴ 5s¹
	42: [2, 8, 18, 13, 1], // Mo  [Kr] 4d⁵ 5s¹
	44: [2, 8, 18, 15, 1], // Ru  [Kr] 4d⁷ 5s¹
	45: [2, 8, 18, 16, 1], // Rh  [Kr] 4d⁸ 5s¹
	46: [2, 8, 18, 18, 0], // Pd  [Kr] 4d¹⁰ — оба s-электрона проваливаются
	47: [2, 8, 18, 18, 1], // Ag  [Kr] 4d¹⁰ 5s¹
	78: [2, 8, 18, 32, 17, 1], // Pt  [Xe] 4f¹⁴ 5d⁹ 6s¹
	79: [2, 8, 18, 32, 18, 1], // Au  [Xe] 4f¹⁴ 5d¹⁰ 6s¹
	// f-блок: лантаноиды/актиноиды с d-вкраплением
	57: [2, 8, 18, 18, 9, 2], // La  [Xe] 5d¹ 6s²
	58: [2, 8, 18, 19, 9, 2], // Ce  [Xe] 4f¹ 5d¹ 6s²
	64: [2, 8, 18, 25, 9, 2], // Gd  [Xe] 4f⁷ 5d¹ 6s²
	89: [2, 8, 18, 32, 18, 9, 2], // Ac  [Rn] 6d¹ 7s²
	90: [2, 8, 18, 32, 18, 10, 2], // Th  [Rn] 6d² 7s²
	91: [2, 8, 18, 32, 20, 9, 2], // Pa  [Rn] 5f² 6d¹ 7s²
	92: [2, 8, 18, 32, 21, 9, 2], // U   [Rn] 5f³ 6d¹ 7s²
	93: [2, 8, 18, 32, 22, 9, 2], // Np  [Rn] 5f⁴ 6d¹ 7s²
	96: [2, 8, 18, 32, 25, 9, 2], // Cm  [Rn] 5f⁷ 6d¹ 7s²
	103: [2, 8, 18, 32, 32, 8, 3] // Lr  [Rn] 5f¹⁴ 7s² 7p¹
};

/**
 * Кол-во электронов на каждой оболочке для атома с данным Z.
 * Например, Fe (Z=26) → [2, 8, 14, 2]; Cu (Z=29) → [2, 8, 18, 1].
 */
export function shellDistribution(atomicNumber: number): number[] {
	const anomaly = ANOMALIES[atomicNumber];
	if (anomaly) return [...anomaly];

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
