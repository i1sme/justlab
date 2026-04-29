// Правиловый движок — fallback после exact-match поиска в reaction-engine.
//
// Принцип CLAUDE.md «не выдумываем продукты» соблюдается так: каждое правило —
// это известный из учебника шаблон (нейтрализация, ряд активности, осаждение по
// растворимости). Продукты конструируются только из ионов, для которых соответствующая
// соль фактически присутствует в БД (substances.ts). Если продукта нет — правило
// возвращает null, и UI честно скажет «реакция неизвестна».
//
// Reaction объект, который возвращают правила, помечается inferenceSource = 'rules' —
// UI показывает соответствующий бейдж, чтобы пользователь видел разницу между
// «у нас есть точная запись» и «выведено из общих правил».

import type { Reaction, ReactantSpec, ReactionFrame, VisualEffect } from '../../data/types';
import type { UserConditions } from './reaction-engine';
import { findSubstance } from '../../data/substances';
import {
	ACID_TO_ANION,
	ANIONS,
	BASE_TO_CATION,
	CATIONS,
	METAL_TO_CATION,
	SALT_TO_IONS,
	STRONG_ACID_IDS,
	STRONG_BASE_IDS,
	displacesHydrogen,
	findSaltByIons,
	getSolubility,
	gcd,
	saltComposition,
	type IonSpec
} from '../../data/chemistry-rules';

// ============================================================
// Публичный API
// ============================================================

/**
 * Попробовать вывести реакцию из правил. Возвращает null, если ни одно правило не сработало.
 * Порядок проверки фиксирован — более специфичные правила раньше, чтобы избежать перекрытий.
 */
export function predictByRules(
	inputs: readonly ReactantSpec[],
	conditions: UserConditions = {}
): Reaction | null {
	if (inputs.length < 2) return null;
	return (
		tryNeutralization(inputs, conditions) ??
		tryAcidMetal(inputs, conditions) ??
		tryPrecipitation(inputs, conditions) ??
		null
	);
}

/**
 * Считаем, что вещество подходит как «жидкий реагент» если оно явно aqueous
 * либо фаза вообще не указана (тогда полагаемся на defaultPhase из SUBSTANCE_BY_ID,
 * но реальная проверка делается в reaction-engine при поиске exact-match).
 *
 * Для правил это означает: если пользователь явно поставил, например, HCl(g) —
 * правило нейтрализации НЕ срабатывает (это другая физическая ситуация).
 */
function isAqueousOrUnspecified(input: ReactantSpec): boolean {
	return input.state === undefined || input.state === 'aqueous';
}

// ============================================================
// Rule 1 — нейтрализация: сильная кислота + сильное основание → соль + вода
// ============================================================

function tryNeutralization(inputs: readonly ReactantSpec[], cond: UserConditions): Reaction | null {
	if ((cond.medium ?? 'water') !== 'water') return null;
	const acidInput = inputs.find(
		(i) => STRONG_ACID_IDS.has(i.substanceId) && isAqueousOrUnspecified(i)
	);
	const baseInput = inputs.find(
		(i) => STRONG_BASE_IDS.has(i.substanceId) && isAqueousOrUnspecified(i)
	);
	if (!acidInput || !baseInput) return null;

	const anionKey = ACID_TO_ANION[acidInput.substanceId];
	const cationKey = BASE_TO_CATION[baseInput.substanceId];
	if (!anionKey || !cationKey) return null;

	const saltId = findSaltByIons(cationKey, anionKey);
	if (!saltId) return null; // соли нет в БД — не выдумываем

	const cation = CATIONS[cationKey];
	const anion = ANIONS[anionKey];
	const c = neutralizationCoefs(anion.charge, cation.charge);

	return {
		id: `inferred:neutralization:${acidInput.substanceId}+${baseInput.substanceId}`,
		category: 'neutralization',
		inputs: [
			{ substanceId: acidInput.substanceId, amount: c.acid, state: 'aqueous' },
			{ substanceId: baseInput.substanceId, amount: c.base, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: saltId, amount: c.salt, state: 'aqueous' },
			{ substanceId: 'water', amount: c.water, state: 'liquid' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 1.5,
		timeline: neutralizationTimeline(),
		equation: buildEquation(
			[
				{ id: acidInput.substanceId, coef: c.acid },
				{ id: baseInput.substanceId, coef: c.base }
			],
			[
				{ id: saltId, coef: c.salt },
				{ id: 'water', coef: c.water }
			]
		),
		description: describeNeutralization(acidInput.substanceId, baseInput.substanceId, saltId),
		glossaryRefs: ['acid', 'base', 'salt', 'neutralization'],
		difficulty: 'school',
		tags: ['inferred'],
		inferenceSource: 'rules'
	};
}

function neutralizationCoefs(
	anionCharge: number,
	cationCharge: number
): { acid: number; base: number; salt: number; water: number } {
	const g = gcd(anionCharge, cationCharge);
	return {
		acid: cationCharge / g,
		base: anionCharge / g,
		salt: 1,
		water: (anionCharge * cationCharge) / g
	};
}

function neutralizationTimeline(): readonly ReactionFrame[] {
	return [
		{ t: 0, effects: [] },
		{
			t: 0.7,
			deltaT: 8,
			effects: [
				{ kind: 'temperature-rise', intensity: 0.5 },
				{ kind: 'color-shift', intensity: 0.25, color: '#ffffff' }
			]
		},
		{ t: 1.5, effects: [] }
	];
}

function describeNeutralization(
	acidId: string,
	baseId: string,
	saltId: string
): { ru: string; en: string } {
	const acid = findSubstance(acidId);
	const base = findSubstance(baseId);
	const salt = findSubstance(saltId);
	return {
		ru:
			`Нейтрализация (выведено из правил): ${acid?.names.ru ?? acidId} + ${base?.names.ru ?? baseId} → ` +
			`${salt?.names.ru ?? saltId} + вода. Реакция экзотермическая, раствор нагревается.`,
		en:
			`Neutralization (inferred from rules): ${acid?.names.en ?? acidId} + ${base?.names.en ?? baseId} → ` +
			`${salt?.names.en ?? saltId} + water. Exothermic; solution warms up.`
	};
}

// ============================================================
// Rule 2 — активный металл + сильная кислота → соль + H₂↑
// ============================================================

function tryAcidMetal(inputs: readonly ReactantSpec[], cond: UserConditions): Reaction | null {
	if ((cond.medium ?? 'water') !== 'water') return null;
	const acidInput = inputs.find(
		(i) => STRONG_ACID_IDS.has(i.substanceId) && isAqueousOrUnspecified(i)
	);
	if (!acidInput) return null;

	// Металл — вещество с substance.kind === 'element' и id из METAL_TO_CATION.
	// Должен быть твёрдым (как в школьном опыте) либо без явной фазы.
	const metalInput = inputs.find(
		(i) => i.substanceId in METAL_TO_CATION && (i.state === undefined || i.state === 'solid')
	);
	if (!metalInput) return null;

	if (!displacesHydrogen(metalInput.substanceId)) return null; // правее H — не выделяет H₂

	const anionKey = ACID_TO_ANION[acidInput.substanceId];
	const cationKey = METAL_TO_CATION[metalInput.substanceId];
	if (!anionKey || !cationKey) return null;

	const saltId = findSaltByIons(cationKey, anionKey);
	if (!saltId) return null;

	const cation = CATIONS[cationKey];
	const anion = ANIONS[anionKey];
	const c = acidMetalCoefs(cation.charge, anion.charge);

	return {
		id: `inferred:displacement:${metalInput.substanceId}+${acidInput.substanceId}`,
		category: 'displacement',
		inputs: [
			{ substanceId: metalInput.substanceId, amount: c.metal, state: 'solid' },
			{ substanceId: acidInput.substanceId, amount: c.acid, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: saltId, amount: c.salt, state: 'aqueous' },
			{ substanceId: 'hydrogen-gas', amount: c.h2, state: 'gas' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 3.5,
		timeline: acidMetalTimeline(),
		equation: buildEquation(
			[
				{ id: metalInput.substanceId, coef: c.metal },
				{ id: acidInput.substanceId, coef: c.acid }
			],
			[
				{ id: saltId, coef: c.salt },
				{ id: 'hydrogen-gas', coef: c.h2 }
			]
		),
		description: describeAcidMetal(metalInput.substanceId, acidInput.substanceId, saltId),
		glossaryRefs: ['acid', 'salt', 'displacement'],
		difficulty: 'school',
		tags: ['inferred'],
		inferenceSource: 'rules'
	};
}

function acidMetalCoefs(
	metalCharge: number,
	anionCharge: number
): { metal: number; acid: number; salt: number; h2: number } {
	// Электронный баланс: x*metalCharge = y*anionCharge (= 2*h2 — числу H+ → H₂).
	const g = gcd(metalCharge, anionCharge);
	let metal = anionCharge / g;
	let acid = metalCharge / g;
	let salt = 1;
	let totalProtons = (metalCharge * anionCharge) / g; // = lcm
	// Чтобы H₂ был целым: если lcm нечётный — удваиваем всё.
	if (totalProtons % 2 !== 0) {
		metal *= 2;
		acid *= 2;
		salt *= 2;
		totalProtons *= 2;
	}
	return { metal, acid, salt, h2: totalProtons / 2 };
}

function acidMetalTimeline(): readonly ReactionFrame[] {
	const bubbles: VisualEffect = {
		kind: 'bubbles',
		intensity: 0.85,
		color: 'rgba(255,255,255,0.7)'
	};
	return [
		{ t: 0, effects: [] },
		{ t: 0.3, effects: [{ ...bubbles, intensity: 0.5 }] },
		{
			t: 1.4,
			deltaT: 5,
			effects: [bubbles, { kind: 'temperature-rise', intensity: 0.35 }]
		},
		{ t: 2.7, effects: [{ ...bubbles, intensity: 0.45 }] },
		{ t: 3.5, effects: [] }
	];
}

function describeAcidMetal(
	metalId: string,
	acidId: string,
	saltId: string
): { ru: string; en: string } {
	const metal = findSubstance(metalId);
	const acid = findSubstance(acidId);
	const salt = findSubstance(saltId);
	return {
		ru:
			`Реакция замещения (выведено из правил): ${metal?.names.ru ?? metalId} активнее водорода и ` +
			`вытесняет H₂ из ${acid?.names.ru ?? acidId}. Образуется ${salt?.names.ru ?? saltId} и пузырьки водорода.`,
		en:
			`Single displacement (inferred from rules): ${metal?.names.en ?? metalId} is more reactive than hydrogen and ` +
			`displaces H₂ from ${acid?.names.en ?? acidId}. Forms ${salt?.names.en ?? saltId} and hydrogen bubbles.`
	};
}

// ============================================================
// Rule 3 — осаждение: две растворимые соли → нерастворимый осадок
// ============================================================

function tryPrecipitation(inputs: readonly ReactantSpec[], cond: UserConditions): Reaction | null {
	if ((cond.medium ?? 'water') !== 'water') return null;
	if (inputs.length < 2) return null;

	// Берём первые два «солевых» входа (с записью в SALT_TO_IONS) в водной форме —
	// осаждение идёт только в растворе. Если соль явно solid и не растворена — не выводим.
	const salts: { id: string; ions: (typeof SALT_TO_IONS)[string] }[] = [];
	for (const inp of inputs) {
		const ions = SALT_TO_IONS[inp.substanceId];
		if (ions && isAqueousOrUnspecified(inp)) salts.push({ id: inp.substanceId, ions });
		if (salts.length === 2) break;
	}
	if (salts.length < 2) return null;
	if (salts[0].ions.cation === salts[1].ions.cation) return null;
	if (salts[0].ions.anion === salts[1].ions.anion) return null;

	// Обе исходные соли должны быть растворимыми (иначе не было бы реакции в растворе).
	if (getSolubility(salts[0].ions.cation, salts[0].ions.anion) !== 'soluble') return null;
	if (getSolubility(salts[1].ions.cation, salts[1].ions.anion) !== 'soluble') return null;

	// Кросс-комбинации: salt1.cation × salt2.anion и salt2.cation × salt1.anion.
	const crossA = {
		cation: salts[0].ions.cation,
		anion: salts[1].ions.anion
	};
	const crossB = {
		cation: salts[1].ions.cation,
		anion: salts[0].ions.anion
	};

	const solA = getSolubility(crossA.cation, crossA.anion);
	const solB = getSolubility(crossB.cation, crossB.anion);
	// Нужен хотя бы один нерастворимый продукт — иначе реакции, по сути, нет.
	if (solA !== 'insoluble' && solB !== 'insoluble') return null;

	const productAId = findSaltByIons(crossA.cation, crossA.anion);
	const productBId = findSaltByIons(crossB.cation, crossB.anion);
	if (!productAId || !productBId) return null;

	const precipitateId = solA === 'insoluble' ? productAId : productBId;
	const precipitateColor = phaseColor(precipitateId, 'solid') ?? '#fafafa';

	return {
		id: `inferred:precipitation:${salts[0].id}+${salts[1].id}`,
		category: 'precipitation',
		inputs: [
			{ substanceId: salts[0].id, amount: 1, state: 'aqueous' },
			{ substanceId: salts[1].id, amount: 1, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: productAId, amount: 1, state: solA === 'insoluble' ? 'solid' : 'aqueous' },
			{ substanceId: productBId, amount: 1, state: solB === 'insoluble' ? 'solid' : 'aqueous' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 2.0,
		timeline: precipitationTimeline(precipitateColor),
		equation: buildEquation(
			[
				{ id: salts[0].id, coef: 1 },
				{ id: salts[1].id, coef: 1 }
			],
			[
				{ id: productAId, coef: 1 },
				{ id: productBId, coef: 1 }
			]
		),
		description: describePrecipitation(salts[0].id, salts[1].id, precipitateId),
		glossaryRefs: ['salt', 'precipitate'],
		difficulty: 'school',
		tags: ['inferred'],
		inferenceSource: 'rules'
	};
}

function precipitationTimeline(color: string): readonly ReactionFrame[] {
	return [
		{ t: 0, effects: [] },
		{
			t: 0.4,
			effects: [{ kind: 'precipitate', intensity: 0.85, color }]
		},
		{
			t: 1.4,
			effects: [{ kind: 'precipitate', intensity: 0.55, color }]
		},
		{ t: 2.0, effects: [] }
	];
}

function describePrecipitation(
	saltAId: string,
	saltBId: string,
	precipitateId: string
): { ru: string; en: string } {
	const a = findSubstance(saltAId);
	const b = findSubstance(saltBId);
	const p = findSubstance(precipitateId);
	return {
		ru:
			`Осаждение (выведено из правил): при смешивании растворов ${a?.names.ru ?? saltAId} и ` +
			`${b?.names.ru ?? saltBId} выпадает нерастворимая ${p?.names.ru ?? precipitateId} — это осадок.`,
		en:
			`Precipitation (inferred from rules): mixing solutions of ${a?.names.en ?? saltAId} and ` +
			`${b?.names.en ?? saltBId} produces insoluble ${p?.names.en ?? precipitateId} as a precipitate.`
	};
}

function phaseColor(substanceId: string, phase: 'solid' | 'aqueous'): string | undefined {
	return findSubstance(substanceId)?.phases[phase]?.color;
}

// ============================================================
// Утилиты построения уравнения
// ============================================================

interface EquationTerm {
	id: string;
	coef: number;
}

function buildEquation(left: EquationTerm[], right: EquationTerm[]): string {
	const part = (t: EquationTerm) => formatTerm(t);
	return `${left.map(part).join(' + ')} → ${right.map(part).join(' + ')}`;
}

function formatTerm(t: EquationTerm): string {
	const f = findSubstance(t.id)?.formula ?? t.id;
	return t.coef === 1 ? f : `${t.coef} ${f}`;
}

// Утилиты для построения формул соли (на случай, если потребуются вне engine).
const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
function subscript(n: number): string {
	if (n === 1) return '';
	return n
		.toString()
		.split('')
		.map((d) => SUBSCRIPTS[Number(d)])
		.join('');
}

function isPolyatomic(formula: string): boolean {
	// Грубая эвристика: имеет 2+ заглавных букв или цифры/подстрочные цифры.
	return /[A-Z].*[A-Z]/.test(formula) || /[0-9₀-₉]/.test(formula);
}

/** Записать ион с counter: 'Cl' × 2 → 'Cl₂'; 'OH' × 2 → '(OH)₂'. */
export function formatIon(ion: IonSpec, count: number): string {
	if (count === 1) return ion.formula;
	return isPolyatomic(ion.formula)
		? `(${ion.formula})${subscript(count)}`
		: `${ion.formula}${subscript(count)}`;
}

/** Готовая формула соли из ионов: например, Na₂SO₄. */
export function buildSaltFormula(cation: IonSpec, anion: IonSpec): string {
	const { cationCount, anionCount } = saltComposition(cation.charge, anion.charge);
	return formatIon(cation, cationCount) + formatIon(anion, anionCount);
}
