// Адаптеры существующих сущностей в унифицированный Substance.
// Подход — не переписываем PeriodicElement / CuratedMolecule, а строим тонкую обёртку:
//   ELEMENTS, MOLECULES → SUBSTANCES + SUBSTANCE_BY_ID
// Это позволяет лаборатории и реакционному движку работать с одним типом, а старый код
// (таблица, просмотрщик) продолжает использовать свои данные без изменений.

import { ELEMENTS, type PeriodicElement } from './elements';
import { MOLECULES, type CuratedMolecule } from './molecules';
import { INORGANIC_SUBSTANCES } from './inorganic-substances';
import { cpkColor } from '../lib/chemistry/cpk-colors';
import type { Substance, Phase, Difficulty } from './types';

// ============================================================
// Element → Substance
// ============================================================

/** Газы при STP (T=298 K, P=101.3 кПа). Источник — справочник. */
const GAS_AT_STP: ReadonlySet<string> = new Set([
	'H',
	'He',
	'N',
	'O',
	'F',
	'Ne',
	'Cl',
	'Ar',
	'Kr',
	'Xe',
	'Rn',
	'Og'
]);

/** Жидкости при STP. */
const LIQUID_AT_STP: ReadonlySet<string> = new Set(['Hg', 'Br']);

/**
 * Цвет окрашивания пламени — для качественного анализа.
 * Используем при горении в лаборатории (флэйм-тест реакции).
 */
const FLAME_COLOR: Readonly<Record<string, string>> = {
	Li: '#ff3838', // карминно-красный
	Na: '#ffd23f', // жёлтый
	K: '#a64bf4', // фиолетовый
	Rb: '#cf5ec0', // красно-фиолетовый
	Cs: '#5a8fbb', // голубой
	Ca: '#ff7e36', // кирпично-красный / оранжевый
	Sr: '#ff2a4d', // ярко-красный
	Ba: '#a3ff45', // зелёный
	Cu: '#37e89e', // изумрудно-зелёный
	B: '#5dff43' // зелёно-жёлтый
};

function inferElementDefaultPhase(symbol: string): Phase {
	if (GAS_AT_STP.has(symbol)) return 'gas';
	if (LIQUID_AT_STP.has(symbol)) return 'liquid';
	return 'solid';
}

/** Сложность вещества — простые элементы школьные, синтетические/редкие — вузовские. */
function inferElementDifficulty(el: PeriodicElement): Difficulty {
	if (el.number > 103) return 'university';
	if (el.category === 'lanthanoid' || el.category === 'actinoid') return 'university';
	return 'school';
}

export function elementToSubstance(el: PeriodicElement): Substance {
	const phase = inferElementDefaultPhase(el.symbol);
	const flameColor = FLAME_COLOR[el.symbol];

	// CPK-цвет для атома — используем как «цвет вещества» в стандартной фазе.
	const colorByPhase: Substance['phases'] = {
		[phase]: { color: cpkColor(el.symbol) }
	};

	return {
		id: el.symbol,
		kind: 'element',
		formula: el.symbol,
		names: el.name,
		phases: colorByPhase,
		defaultPhase: phase,
		molarMass: el.atomicMass,
		flameColor,
		elementCategory: el.category,
		atomicNumber: el.number,
		glossaryRefs: ['atom', 'element'],
		difficulty: inferElementDifficulty(el)
	};
}

// ============================================================
// Molecule → Substance
// ============================================================

/**
 * Курируемые умолчания для известных молекул.
 * Если ключа нет — fallback в `defaultMoleculePhase()` по категории.
 */
const MOLECULE_PHASE: Readonly<Record<string, Phase>> = {
	water: 'liquid',
	ammonia: 'gas',
	'carbon-dioxide': 'gas',
	'sulfur-dioxide': 'gas',
	'hydrogen-peroxide': 'liquid',
	'hydrochloric-acid': 'aqueous',
	'sulfuric-acid': 'liquid',
	'nitric-acid': 'liquid',
	'acetic-acid': 'liquid',
	'formic-acid': 'liquid',
	'carbonic-acid': 'aqueous',
	methane: 'gas',
	ethane: 'gas',
	ethanol: 'liquid',
	methanol: 'liquid',
	acetone: 'liquid',
	glycerol: 'liquid',
	ethylene: 'gas',
	benzene: 'liquid',
	toluene: 'liquid',
	phenol: 'solid',
	naphthalene: 'solid',
	glucose: 'solid',
	glycine: 'solid',
	alanine: 'solid',
	urea: 'solid',
	'lactic-acid': 'liquid',
	aspirin: 'solid',
	paracetamol: 'solid',
	caffeine: 'solid',
	'vitamin-c': 'solid'
};

function defaultMoleculePhase(mol: CuratedMolecule): Phase {
	return MOLECULE_PHASE[mol.key] ?? (mol.category === 'inorganic' ? 'gas' : 'liquid');
}

function inferMoleculeDifficulty(mol: CuratedMolecule): Difficulty {
	if (mol.category === 'biology' || mol.category === 'drug') return 'university';
	if (mol.category === 'aromatic') return 'school';
	return 'school';
}

export function moleculeToSubstance(mol: CuratedMolecule): Substance {
	const phase = defaultMoleculePhase(mol);
	return {
		id: mol.key,
		kind: 'molecule',
		formula: mol.formula,
		smiles: mol.smiles,
		names: mol.name,
		phases: { [phase]: {} },
		defaultPhase: phase,
		glossaryRefs: ['molecule', 'compound'],
		difficulty: inferMoleculeDifficulty(mol)
	};
}

// ============================================================
// Сводный реестр
// ============================================================

const elementSubstances: readonly Substance[] = ELEMENTS.map(elementToSubstance);
const moleculeSubstances: readonly Substance[] = MOLECULES.map(moleculeToSubstance);

/**
 * Все вещества в системе. Iterable, но для частых поисков использовать SUBSTANCE_BY_ID.
 * Источник правды для лабораторного inventory + reaction-engine.
 *
 * Состав:
 *   - 118 элементов (через elementToSubstance)
 *   - 30 органических/aromatic/biology молекул из MoleculeLibrary (через moleculeToSubstance)
 *   - ~22 курируемых неорганических соединения (соли, гидроксиды, оксиды, газы)
 */
export const SUBSTANCES: readonly Substance[] = [
	...elementSubstances,
	...moleculeSubstances,
	...INORGANIC_SUBSTANCES
];

/** O(1) lookup по ID. */
export const SUBSTANCE_BY_ID: ReadonlyMap<string, Substance> = new Map(
	SUBSTANCES.map((s) => [s.id, s])
);

/** Helper: безопасный поиск; возвращает undefined если ID неизвестен. */
export function findSubstance(id: string): Substance | undefined {
	return SUBSTANCE_BY_ID.get(id);
}
