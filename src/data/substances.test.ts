// Тесты адаптеров и сводного реестра Substance.
// Цель — отлавливать поломки в адаптерах после изменений в elements.ts/molecules.ts
// и гарантировать целостность ID-ключей (без дубликатов между элементами и молекулами).

import { describe, expect, it } from 'vitest';
import { ELEMENTS } from './elements';
import { MOLECULES } from './molecules';
import {
	SUBSTANCES,
	SUBSTANCE_BY_ID,
	elementToSubstance,
	moleculeToSubstance,
	findSubstance
} from './substances';

describe('elementToSubstance', () => {
	it('Fe → solid, school-level, имена сохраняются', () => {
		const fe = ELEMENTS.find((e) => e.symbol === 'Fe');
		expect(fe).toBeDefined();
		const subst = elementToSubstance(fe!);
		expect(subst.id).toBe('Fe');
		expect(subst.kind).toBe('element');
		expect(subst.formula).toBe('Fe');
		expect(subst.defaultPhase).toBe('solid');
		expect(subst.names.ru).toBe('Железо');
		expect(subst.names.en).toBe('Iron');
		expect(subst.atomicNumber).toBe(26);
		expect(subst.molarMass).toBeCloseTo(55.845, 2);
		expect(subst.difficulty).toBe('school');
	});

	it('водород — газ при STP', () => {
		const h = ELEMENTS.find((e) => e.symbol === 'H');
		expect(elementToSubstance(h!).defaultPhase).toBe('gas');
	});

	it('ртуть и бром — жидкости при STP', () => {
		expect(elementToSubstance(ELEMENTS.find((e) => e.symbol === 'Hg')!).defaultPhase).toBe(
			'liquid'
		);
		expect(elementToSubstance(ELEMENTS.find((e) => e.symbol === 'Br')!).defaultPhase).toBe(
			'liquid'
		);
	});

	it('натрий: жёлтое пламя', () => {
		const na = elementToSubstance(ELEMENTS.find((e) => e.symbol === 'Na')!);
		expect(na.flameColor).toBeTruthy();
		expect(na.flameColor!.toLowerCase()).toBe('#ffd23f');
	});

	it('калий: фиолетовое пламя', () => {
		const k = elementToSubstance(ELEMENTS.find((e) => e.symbol === 'K')!);
		expect(k.flameColor).toBeTruthy();
	});

	it('категория элемента переносится в Substance', () => {
		const fe = elementToSubstance(ELEMENTS.find((e) => e.symbol === 'Fe')!);
		expect(fe.elementCategory).toBe('transition-metal');
	});

	it('лантаноиды и актиноиды — university-уровень', () => {
		const la = elementToSubstance(ELEMENTS.find((e) => e.symbol === 'La')!);
		expect(la.difficulty).toBe('university');
		const u = elementToSubstance(ELEMENTS.find((e) => e.symbol === 'U')!);
		expect(u.difficulty).toBe('university');
	});

	it('каждый элемент имеет валидный Substance', () => {
		for (const el of ELEMENTS) {
			const s = elementToSubstance(el);
			expect(s.id, `id для ${el.symbol}`).toBe(el.symbol);
			expect(s.names.ru.length, `ru name для ${el.symbol}`).toBeGreaterThan(0);
			expect(s.names.en.length, `en name для ${el.symbol}`).toBeGreaterThan(0);
			expect(s.phases[s.defaultPhase], `phase data для ${el.symbol}`).toBeDefined();
		}
	});
});

describe('moleculeToSubstance', () => {
	it('вода — жидкость со SMILES', () => {
		const water = MOLECULES.find((m) => m.key === 'water')!;
		const subst = moleculeToSubstance(water);
		expect(subst.id).toBe('water');
		expect(subst.defaultPhase).toBe('liquid');
		expect(subst.smiles).toBe('O');
		expect(subst.names.ru).toBe('Вода');
	});

	it('аммиак, метан, CO₂ — газы', () => {
		expect(moleculeToSubstance(MOLECULES.find((m) => m.key === 'ammonia')!).defaultPhase).toBe(
			'gas'
		);
		expect(moleculeToSubstance(MOLECULES.find((m) => m.key === 'methane')!).defaultPhase).toBe(
			'gas'
		);
		expect(
			moleculeToSubstance(MOLECULES.find((m) => m.key === 'carbon-dioxide')!).defaultPhase
		).toBe('gas');
	});

	it('глюкоза, аспирин — твёрдые', () => {
		expect(moleculeToSubstance(MOLECULES.find((m) => m.key === 'glucose')!).defaultPhase).toBe(
			'solid'
		);
		expect(moleculeToSubstance(MOLECULES.find((m) => m.key === 'aspirin')!).defaultPhase).toBe(
			'solid'
		);
	});

	it('HCl — водный раствор по умолчанию (учебный кейс)', () => {
		expect(
			moleculeToSubstance(MOLECULES.find((m) => m.key === 'hydrochloric-acid')!).defaultPhase
		).toBe('aqueous');
	});

	it('биология/лекарства — university-уровень', () => {
		const glucose = moleculeToSubstance(MOLECULES.find((m) => m.key === 'glucose')!);
		expect(glucose.difficulty).toBe('university');
		const aspirin = moleculeToSubstance(MOLECULES.find((m) => m.key === 'aspirin')!);
		expect(aspirin.difficulty).toBe('university');
	});
});

describe('SUBSTANCES реестр', () => {
	it('содержит все элементы и молекулы', () => {
		expect(SUBSTANCES.length).toBe(ELEMENTS.length + MOLECULES.length);
	});

	it('никаких дубликатов ID', () => {
		const ids = new Set(SUBSTANCES.map((s) => s.id));
		expect(ids.size, 'дубликат ID между элементами и молекулами').toBe(SUBSTANCES.length);
	});

	it('SUBSTANCE_BY_ID находит элементы и молекулы', () => {
		const fe = findSubstance('Fe');
		expect(fe?.kind).toBe('element');
		expect(fe?.atomicNumber).toBe(26);

		const water = findSubstance('water');
		expect(water?.kind).toBe('molecule');
		expect(water?.smiles).toBe('O');
	});

	it('findSubstance возвращает undefined для неизвестных ID', () => {
		expect(findSubstance('unknown-substance-xyz')).toBeUndefined();
	});

	it('SUBSTANCE_BY_ID размер совпадает с длиной массива', () => {
		expect(SUBSTANCE_BY_ID.size).toBe(SUBSTANCES.length);
	});
});
