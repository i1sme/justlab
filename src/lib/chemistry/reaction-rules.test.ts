// Тесты правилового движка. Проверяем что fallback в reaction-engine отрабатывает,
// reaction.inferenceSource = 'rules', а стехиометрия и продукты соответствуют учебнику.
//
// Принцип CLAUDE.md «не выдумываем продукты» закреплён тестом: если соли-продукта нет
// в БД, правило обязано вернуть null (а findReaction следом — null), а не сфабриковать.

import { describe, expect, it } from 'vitest';
import { findReaction } from './reaction-engine';
import { predictByRules, buildSaltFormula, formatIon } from './reaction-rules';
import { CATIONS, ANIONS, gcd, saltComposition } from '../../data/chemistry-rules';

describe('правиловый движок — нейтрализация', () => {
	it('HCl + KOH → KCl + H₂O (нет в БД, выводится из правил)', () => {
		const r = findReaction(
			[
				{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' },
				{ substanceId: 'potassium-hydroxide', amount: 1, state: 'aqueous' }
			],
			{ medium: 'water' }
		);
		expect(r).not.toBeNull();
		expect(r?.inferenceSource).toBe('rules');
		expect(r?.category).toBe('neutralization');
		expect(r?.outputs.map((o) => o.substanceId).sort()).toEqual(['potassium-chloride', 'water']);
	});

	it('HNO₃ + NaOH → NaNO₃ + H₂O (правила покрывают и эту пару)', () => {
		const r = findReaction([
			{ substanceId: 'nitric-acid', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
		]);
		expect(r?.inferenceSource).toBe('rules');
		expect(r?.outputs.map((o) => o.substanceId).sort()).toEqual(['sodium-nitrate', 'water']);
	});

	it('H₂SO₄ + 2 NaOH — стехиометрия 1:2:1:2', () => {
		const r = findReaction([
			{ substanceId: 'sulfuric-acid', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
		]);
		expect(r?.inferenceSource).toBe('rules');
		expect(r?.outputs.find((o) => o.substanceId === 'sodium-sulfate')?.amount).toBe(1);
		expect(r?.outputs.find((o) => o.substanceId === 'water')?.amount).toBe(2);
		expect(r?.inputs.find((i) => i.substanceId === 'sulfuric-acid')?.amount).toBe(1);
		expect(r?.inputs.find((i) => i.substanceId === 'sodium-hydroxide')?.amount).toBe(2);
	});

	it('точная запись в БД приоритетнее — HCl+NaOH использует hcl-naoh, а не правило', () => {
		const r = findReaction([
			{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
		]);
		expect(r?.id).toBe('hcl-naoh');
		expect(r?.inferenceSource).toBeUndefined();
	});

	it('слабая кислота (CH₃COOH) — правило нейтрализации не срабатывает', () => {
		// Без exact-match эта пара не должна давать правиловый результат
		// (acetic-acid не в STRONG_ACID_IDS). Но в БД есть точная запись acetic-acid-naoh
		// — её и должны получить:
		const r = findReaction([
			{ substanceId: 'acetic-acid', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
		]);
		expect(r?.id).toBe('acetic-acid-naoh');
		expect(r?.inferenceSource).toBeUndefined();
	});
});

describe('правиловый движок — металл + кислота', () => {
	it('Zn + 2 HCl → ZnCl₂ + H₂↑ (есть в БД, exact-match приоритетнее)', () => {
		const r = findReaction([
			{ substanceId: 'Zn', amount: 1, state: 'solid' },
			{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' }
		]);
		expect(r?.id).toBe('zn-hcl');
		expect(r?.inferenceSource).toBeUndefined();
	});

	it('Zn + H₂SO₄ → ZnSO₄ + H₂↑ (нет в БД, выводится правилом)', () => {
		const r = findReaction([
			{ substanceId: 'Zn', amount: 1, state: 'solid' },
			{ substanceId: 'sulfuric-acid', amount: 1, state: 'aqueous' }
		]);
		expect(r?.inferenceSource).toBe('rules');
		expect(r?.category).toBe('displacement');
		expect(r?.outputs.map((o) => o.substanceId).sort()).toEqual(['hydrogen-gas', 'zinc-sulfate']);
		// Стехиометрия: Zn(2) + SO4(2): gcd=2, lcm=2 (чёт.). 1 Zn + 1 H₂SO₄ → 1 ZnSO₄ + 1 H₂
		const h2 = r?.outputs.find((o) => o.substanceId === 'hydrogen-gas');
		expect(h2?.amount).toBe(1);
	});

	it('Mg + H₂SO₄ → MgSO₄ + H₂↑', () => {
		const r = findReaction([
			{ substanceId: 'Mg', amount: 1, state: 'solid' },
			{ substanceId: 'sulfuric-acid', amount: 1, state: 'aqueous' }
		]);
		expect(r?.inferenceSource).toBe('rules');
		expect(r?.outputs.map((o) => o.substanceId).sort()).toEqual([
			'hydrogen-gas',
			'magnesium-sulfate'
		]);
	});

	it('Cu + HCl → null (Cu правее H в ряду активности)', () => {
		const r = findReaction([
			{ substanceId: 'Cu', amount: 1, state: 'solid' },
			{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' }
		]);
		expect(r).toBeNull();
	});

	it('Ag + HCl → null (Ag правее H)', () => {
		expect(
			findReaction([
				{ substanceId: 'Ag', amount: 1, state: 'solid' },
				{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' }
			])
		).toBeNull();
	});

	it('Al + HCl → AlCl₃ + H₂ (нет в БД, нет соли AlCl₃ в БД → null)', () => {
		// AlCl3 не в SALT_TO_IONS — рулу нечего вернуть, не выдумываем.
		const r = findReaction([
			{ substanceId: 'Al', amount: 1, state: 'solid' },
			{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' }
		]);
		expect(r).toBeNull();
	});
});

describe('правиловый движок — осаждение', () => {
	it('AgNO₃ + KCl → AgCl↓ + KNO₃ (нет в БД, выводится правилом)', () => {
		const r = findReaction([
			{ substanceId: 'silver-nitrate', amount: 1, state: 'aqueous' },
			{ substanceId: 'potassium-chloride', amount: 1, state: 'aqueous' }
		]);
		expect(r?.inferenceSource).toBe('rules');
		expect(r?.category).toBe('precipitation');
		expect(r?.outputs.map((o) => o.substanceId).sort()).toEqual([
			'potassium-nitrate',
			'silver-chloride'
		]);
		const agcl = r?.outputs.find((o) => o.substanceId === 'silver-chloride');
		expect(agcl?.state).toBe('solid'); // осадок
	});

	it('AgNO₃ + NaCl — exact-match приоритетнее правила', () => {
		// agno3-nacl есть в БД — должен использоваться он.
		const r = findReaction([
			{ substanceId: 'silver-nitrate', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' }
		]);
		expect(r?.id).toBe('agno3-nacl');
		expect(r?.inferenceSource).toBeUndefined();
	});

	it('NaCl + KNO₃ → null (обе соли растворимые — реакции нет)', () => {
		// Все Na+, K+, NO3-, Cl- — растворимые, swap тоже даст растворимое. Реакции нет.
		const r = findReaction([
			{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' },
			{ substanceId: 'potassium-nitrate', amount: 1, state: 'aqueous' }
		]);
		expect(r).toBeNull();
	});

	it('NaCl + Na₂SO₄ → null (общий катион — реакции нет)', () => {
		expect(
			findReaction([
				{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' },
				{ substanceId: 'sodium-sulfate', amount: 1, state: 'aqueous' }
			])
		).toBeNull();
	});
});

describe('правиловый движок — отрицательные кейсы (CLAUDE.md «не выдумываем»)', () => {
	it('одно вещество → null', () => {
		expect(predictByRules([{ substanceId: 'hydrochloric-acid', amount: 1 }])).toBeNull();
	});

	it('два вещества без подходящего правила → null', () => {
		expect(
			predictByRules([
				{ substanceId: 'water', amount: 1, state: 'liquid' },
				{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' }
			])
		).toBeNull();
	});

	it('правило не срабатывает в air-среде', () => {
		expect(
			predictByRules(
				[
					{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' },
					{ substanceId: 'potassium-hydroxide', amount: 1, state: 'aqueous' }
				],
				{ medium: 'air' }
			)
		).toBeNull();
	});

	it('правиловые реакции помечены тегом inferred и source=rules', () => {
		const r = predictByRules(
			[
				{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' },
				{ substanceId: 'potassium-hydroxide', amount: 1, state: 'aqueous' }
			],
			{ medium: 'water' }
		);
		expect(r?.inferenceSource).toBe('rules');
		expect(r?.tags).toContain('inferred');
	});

	it('у правиловой реакции есть валидный timeline', () => {
		const r = predictByRules(
			[
				{ substanceId: 'Zn', amount: 1, state: 'solid' },
				{ substanceId: 'sulfuric-acid', amount: 1, state: 'aqueous' }
			],
			{ medium: 'water' }
		);
		expect(r?.timeline.length).toBeGreaterThan(1);
		expect(r?.timeline[0].t).toBe(0);
		for (let i = 1; i < (r?.timeline.length ?? 0); i++) {
			expect(r!.timeline[i].t).toBeGreaterThanOrEqual(r!.timeline[i - 1].t);
		}
	});
});

describe('утилиты стехиометрии', () => {
	it('gcd базовый', () => {
		expect(gcd(6, 9)).toBe(3);
		expect(gcd(2, 1)).toBe(1);
		expect(gcd(12, 8)).toBe(4);
	});

	it('saltComposition правильно считает Na₂SO₄', () => {
		expect(saltComposition(1, 2)).toEqual({ cationCount: 2, anionCount: 1 });
	});

	it('saltComposition правильно считает MgCl₂', () => {
		expect(saltComposition(2, 1)).toEqual({ cationCount: 1, anionCount: 2 });
	});

	it('saltComposition правильно считает Al₂(SO₄)₃', () => {
		expect(saltComposition(3, 2)).toEqual({ cationCount: 2, anionCount: 3 });
	});

	it('formatIon — простой ион без счёта', () => {
		expect(formatIon(CATIONS['Na+'], 1)).toBe('Na');
		expect(formatIon(ANIONS['Cl-'], 1)).toBe('Cl');
	});

	it('formatIon — простой ион с счётом', () => {
		expect(formatIon(ANIONS['Cl-'], 2)).toBe('Cl₂');
	});

	it('formatIon — полиатомный ион в скобках', () => {
		expect(formatIon(ANIONS['OH-'], 2)).toBe('(OH)₂');
		expect(formatIon(ANIONS['NO3-'], 2)).toBe('(NO₃)₂');
	});

	it('buildSaltFormula собирает корректные формулы', () => {
		expect(buildSaltFormula(CATIONS['Na+'], ANIONS['Cl-'])).toBe('NaCl');
		expect(buildSaltFormula(CATIONS['Na+'], ANIONS['SO4-2'])).toBe('Na₂SO₄');
		expect(buildSaltFormula(CATIONS['Mg+2'], ANIONS['Cl-'])).toBe('MgCl₂');
		expect(buildSaltFormula(CATIONS['Al+3'], ANIONS['SO4-2'])).toBe('Al₂(SO₄)₃');
	});
});
