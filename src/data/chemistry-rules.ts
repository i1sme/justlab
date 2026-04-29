// Курируемые таблицы химических знаний — основа правилового движка реакций.
//
// CLAUDE.md: «не выдумываем продукты». Эти таблицы — проверяемая истина из учебника
// (ряд активности металлов, таблица растворимости, классы кислот/оснований),
// а не гипотезы. Движок reaction-rules.ts использует их, чтобы выводить реакции для
// комбинаций, не описанных в БД явно, но всё равно соответствующих известным правилам.
//
// Покрытие v1: только то, для чего у нас есть substance в БД (substances.ts +
// inorganic-substances.ts). Если ион встречается в правиле, но соли с ним нет —
// правило вернёт null, а UI покажет «реакция неизвестна».

// ============================================================
// Сильные кислоты и основания
// ============================================================

/** Полностью диссоциируют в воде. Слабые — нет (acetic-acid и т.п. сюда не входят). */
export const STRONG_ACID_IDS: ReadonlySet<string> = new Set([
	'hydrochloric-acid',
	'sulfuric-acid',
	'nitric-acid'
]);

export const STRONG_BASE_IDS: ReadonlySet<string> = new Set([
	'sodium-hydroxide',
	'potassium-hydroxide'
]);

// ============================================================
// Ионы (cation/anion symbols + заряды)
// ============================================================

/** Заряд (по модулю) — для построения формул и стехиометрии. */
export interface IonSpec {
	symbol: string; // 'Na+', 'Mg+2', 'SO4-2'
	charge: number; // |z| — всегда положительное число
	formula: string; // отображаемая формула без заряда: 'Na', 'Mg', 'SO4'
}

export const CATIONS: Readonly<Record<string, IonSpec>> = {
	'Na+': { symbol: 'Na+', charge: 1, formula: 'Na' },
	'K+': { symbol: 'K+', charge: 1, formula: 'K' },
	'Ag+': { symbol: 'Ag+', charge: 1, formula: 'Ag' },
	'Mg+2': { symbol: 'Mg+2', charge: 2, formula: 'Mg' },
	'Ca+2': { symbol: 'Ca+2', charge: 2, formula: 'Ca' },
	'Ba+2': { symbol: 'Ba+2', charge: 2, formula: 'Ba' },
	'Zn+2': { symbol: 'Zn+2', charge: 2, formula: 'Zn' },
	'Fe+2': { symbol: 'Fe+2', charge: 2, formula: 'Fe' },
	'Cu+2': { symbol: 'Cu+2', charge: 2, formula: 'Cu' },
	'Al+3': { symbol: 'Al+3', charge: 3, formula: 'Al' }
};

export const ANIONS: Readonly<Record<string, IonSpec>> = {
	'Cl-': { symbol: 'Cl-', charge: 1, formula: 'Cl' },
	'NO3-': { symbol: 'NO3-', charge: 1, formula: 'NO₃' },
	'CH3COO-': { symbol: 'CH3COO-', charge: 1, formula: 'CH₃COO' },
	'OH-': { symbol: 'OH-', charge: 1, formula: 'OH' },
	'SO4-2': { symbol: 'SO4-2', charge: 2, formula: 'SO₄' },
	'CO3-2': { symbol: 'CO3-2', charge: 2, formula: 'CO₃' }
};

// ============================================================
// Сопоставление substance ↔ ионы
// ============================================================

/**
 * Кислота → её анион (то, что остаётся после отдачи всех H+).
 * Анион «знает» сколько H+ отщепляется (его заряд).
 */
export const ACID_TO_ANION: Readonly<Record<string, keyof typeof ANIONS>> = {
	'hydrochloric-acid': 'Cl-',
	'nitric-acid': 'NO3-',
	'sulfuric-acid': 'SO4-2',
	'acetic-acid': 'CH3COO-' // слабая, но соль образует
};

/** Основание → его катион (то, что остаётся после отдачи всех OH-). */
export const BASE_TO_CATION: Readonly<Record<string, keyof typeof CATIONS>> = {
	'sodium-hydroxide': 'Na+',
	'potassium-hydroxide': 'K+'
};

/** Металл (substance.id у элемента — его IUPAC-символ) → ион в реакциях. */
export const METAL_TO_CATION: Readonly<Record<string, keyof typeof CATIONS>> = {
	Na: 'Na+',
	K: 'K+',
	Mg: 'Mg+2',
	Ca: 'Ca+2',
	Ba: 'Ba+2',
	Zn: 'Zn+2',
	Fe: 'Fe+2',
	Cu: 'Cu+2',
	Al: 'Al+3',
	Ag: 'Ag+'
};

/** Соль → её ионы. Только то, что фактически есть в БД. */
export interface SaltIons {
	cation: keyof typeof CATIONS;
	anion: keyof typeof ANIONS;
}
export const SALT_TO_IONS: Readonly<Record<string, SaltIons>> = {
	'sodium-chloride': { cation: 'Na+', anion: 'Cl-' },
	'sodium-sulfate': { cation: 'Na+', anion: 'SO4-2' },
	'sodium-nitrate': { cation: 'Na+', anion: 'NO3-' },
	'sodium-acetate': { cation: 'Na+', anion: 'CH3COO-' },
	'potassium-sulfate': { cation: 'K+', anion: 'SO4-2' },
	'potassium-chloride': { cation: 'K+', anion: 'Cl-' },
	'potassium-nitrate': { cation: 'K+', anion: 'NO3-' },
	'silver-nitrate': { cation: 'Ag+', anion: 'NO3-' },
	'silver-chloride': { cation: 'Ag+', anion: 'Cl-' },
	'barium-chloride': { cation: 'Ba+2', anion: 'Cl-' },
	'barium-sulfate': { cation: 'Ba+2', anion: 'SO4-2' },
	'copper-sulfate': { cation: 'Cu+2', anion: 'SO4-2' },
	'iron-sulfate-ii': { cation: 'Fe+2', anion: 'SO4-2' },
	'zinc-chloride': { cation: 'Zn+2', anion: 'Cl-' },
	'zinc-sulfate': { cation: 'Zn+2', anion: 'SO4-2' },
	'magnesium-chloride': { cation: 'Mg+2', anion: 'Cl-' },
	'magnesium-sulfate': { cation: 'Mg+2', anion: 'SO4-2' },
	'calcium-chloride': { cation: 'Ca+2', anion: 'Cl-' },
	'calcium-carbonate': { cation: 'Ca+2', anion: 'CO3-2' }
};

/** Обратный индекс: (cation, anion) → substance ID соли, если она есть в БД. */
const _IONS_TO_SALT: Readonly<Record<string, string>> = (() => {
	const out: Record<string, string> = {};
	for (const [salt, ions] of Object.entries(SALT_TO_IONS)) {
		out[`${ions.cation}|${ions.anion}`] = salt;
	}
	return out;
})();

export function findSaltByIons(
	cation: keyof typeof CATIONS,
	anion: keyof typeof ANIONS
): string | null {
	return _IONS_TO_SALT[`${cation}|${anion}`] ?? null;
}

// ============================================================
// Ряд активности металлов (стандарт Бекетова)
// ============================================================

/**
 * Левее (меньший индекс) — активнее. 'H' — маркер водорода: металлы левее H
 * вытесняют H₂ из кислот. Металлы правее H реагируют только с окисляющими кислотами.
 */
export const METAL_ACTIVITY_SERIES: readonly string[] = [
	'K',
	'Ba',
	'Ca',
	'Na',
	'Mg',
	'Al',
	'Zn',
	'Fe',
	'Ni',
	'Sn',
	'Pb',
	'H',
	'Cu',
	'Hg',
	'Ag',
	'Au'
];

const _ACTIVITY_INDEX: Readonly<Record<string, number>> = (() => {
	const out: Record<string, number> = {};
	METAL_ACTIVITY_SERIES.forEach((sym, i) => (out[sym] = i));
	return out;
})();

/** Активнее ли A металл B? Возвращает null если один из них не в ряду. */
export function isMoreActive(a: string, b: string): boolean | null {
	const ia = _ACTIVITY_INDEX[a];
	const ib = _ACTIVITY_INDEX[b];
	if (ia === undefined || ib === undefined) return null;
	return ia < ib;
}

/** Реагирует ли металл с кислотой неокисляющей силы (HCl, разб. H₂SO₄)? */
export function displacesHydrogen(metalSymbol: string): boolean {
	return isMoreActive(metalSymbol, 'H') === true;
}

// ============================================================
// Таблица растворимости (только проверенные данные)
// ============================================================

/** Записи: cation × anion → 'soluble' | 'insoluble'. Отсутствие записи = «неизвестно» → правило не сработает. */
type Solubility = 'soluble' | 'insoluble';

export const SOLUBILITY: Readonly<Record<string, Readonly<Record<string, Solubility>>>> = {
	'Na+': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'soluble',
		'CO3-2': 'soluble',
		'CH3COO-': 'soluble',
		'OH-': 'soluble'
	},
	'K+': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'soluble',
		'CO3-2': 'soluble',
		'CH3COO-': 'soluble',
		'OH-': 'soluble'
	},
	'Ag+': {
		'Cl-': 'insoluble', // классический белый творожистый осадок
		'NO3-': 'soluble',
		'CH3COO-': 'soluble',
		'OH-': 'insoluble',
		'CO3-2': 'insoluble'
	},
	'Ba+2': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'insoluble', // BaSO4 — другой классический осадок
		'CO3-2': 'insoluble',
		'OH-': 'soluble'
	},
	'Ca+2': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'soluble', // мало растворим, считаем растворимым
		'CO3-2': 'insoluble',
		'OH-': 'soluble'
	},
	'Mg+2': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'soluble',
		'CO3-2': 'insoluble',
		'OH-': 'insoluble'
	},
	'Cu+2': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'soluble',
		'OH-': 'insoluble', // Cu(OH)2 — голубой осадок
		'CO3-2': 'insoluble'
	},
	'Fe+2': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'soluble',
		'OH-': 'insoluble',
		'CO3-2': 'insoluble'
	},
	'Zn+2': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'soluble',
		'OH-': 'insoluble',
		'CO3-2': 'insoluble'
	},
	'Al+3': {
		'Cl-': 'soluble',
		'NO3-': 'soluble',
		'SO4-2': 'soluble',
		'OH-': 'insoluble',
		'CO3-2': 'insoluble'
	}
};

export function getSolubility(
	cation: keyof typeof CATIONS,
	anion: keyof typeof ANIONS
): Solubility | null {
	return SOLUBILITY[cation]?.[anion] ?? null;
}

// ============================================================
// Стехиометрия
// ============================================================

export function gcd(a: number, b: number): number {
	a = Math.abs(a);
	b = Math.abs(b);
	while (b !== 0) {
		[a, b] = [b, a % b];
	}
	return a;
}

export function lcm(a: number, b: number): number {
	return (a * b) / gcd(a, b);
}

/**
 * Состав соли cation_c × anion_a (минимальная единичная формула).
 * Возвращает счёт катионов и анионов в одной формульной единице.
 */
export function saltComposition(
	cationCharge: number,
	anionCharge: number
): { cationCount: number; anionCount: number } {
	const g = gcd(cationCharge, anionCharge);
	return {
		cationCount: anionCharge / g,
		anionCount: cationCharge / g
	};
}
