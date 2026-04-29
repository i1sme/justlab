// Тесты движка: каждая seed-реакция находится; неверные комбинации возвращают null.
// Также проверяем целостность БД реакций (валидные substance ID, нет дубликатов id).

import { describe, expect, it } from 'vitest';
import { findReaction } from './reaction-engine';
import { REACTIONS, REACTION_BY_ID, REACTIONS_BY_KEY } from '../../data/reactions';
import { SUBSTANCE_BY_ID } from '../../data/substances';

describe('findReaction — нейтрализация', () => {
	it('HCl + NaOH → NaCl + H₂O', () => {
		const r = findReaction(
			[
				{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' },
				{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
			],
			{ medium: 'water' }
		);
		expect(r?.id).toBe('hcl-naoh');
		expect(r?.outputs[0].substanceId).toBe('sodium-chloride');
	});

	it('H₂SO₄ + 2 KOH', () => {
		expect(
			findReaction([
				{ substanceId: 'sulfuric-acid', amount: 1, state: 'aqueous' },
				{ substanceId: 'potassium-hydroxide', amount: 2, state: 'aqueous' }
			])?.id
		).toBe('h2so4-koh');
	});

	it('CH₃COOH + NaOH', () => {
		expect(
			findReaction([
				{ substanceId: 'acetic-acid', amount: 1, state: 'aqueous' },
				{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
			])?.id
		).toBe('acetic-acid-naoh');
	});
});

describe('findReaction — осаждение', () => {
	it('AgNO₃ + NaCl → AgCl↓', () => {
		expect(
			findReaction([
				{ substanceId: 'silver-nitrate', amount: 1, state: 'aqueous' },
				{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' }
			])?.id
		).toBe('agno3-nacl');
	});

	it('BaCl₂ + Na₂SO₄ → BaSO₄↓', () => {
		expect(
			findReaction([
				{ substanceId: 'barium-chloride', amount: 1, state: 'aqueous' },
				{ substanceId: 'sodium-sulfate', amount: 1, state: 'aqueous' }
			])?.id
		).toBe('bacl2-na2so4');
	});

	it('CuSO₄ + 2 NaOH → Cu(OH)₂↓', () => {
		expect(
			findReaction([
				{ substanceId: 'copper-sulfate', amount: 1, state: 'aqueous' },
				{ substanceId: 'sodium-hydroxide', amount: 2, state: 'aqueous' }
			])?.id
		).toBe('cuso4-naoh');
	});
});

describe('findReaction — горение', () => {
	it('CH₄ + 2 O₂ только при высокой T', () => {
		const cold = findReaction(
			[
				{ substanceId: 'methane', amount: 1, state: 'gas' },
				{ substanceId: 'oxygen-gas', amount: 2, state: 'gas' }
			],
			{ temperature: 298 }
		);
		expect(cold).toBeNull();

		const hot = findReaction(
			[
				{ substanceId: 'methane', amount: 1, state: 'gas' },
				{ substanceId: 'oxygen-gas', amount: 2, state: 'gas' }
			],
			{ temperature: 1000 }
		);
		expect(hot?.id).toBe('methane-combustion');
	});

	it('2 Mg + O₂ → 2 MgO', () => {
		expect(
			findReaction(
				[
					{ substanceId: 'Mg', amount: 2, state: 'solid' },
					{ substanceId: 'oxygen-gas', amount: 1, state: 'gas' }
				],
				{ temperature: 1000 }
			)?.id
		).toBe('magnesium-combustion');
	});

	it('C + O₂ → CO₂ требует нагрева', () => {
		expect(
			findReaction(
				[
					{ substanceId: 'C', amount: 1, state: 'solid' },
					{ substanceId: 'oxygen-gas', amount: 1, state: 'gas' }
				],
				{ temperature: 900 }
			)?.id
		).toBe('carbon-combustion');
	});
});

describe('findReaction — замещение', () => {
	it('Fe + CuSO₄ → FeSO₄ + Cu', () => {
		expect(
			findReaction([
				{ substanceId: 'Fe', amount: 1, state: 'solid' },
				{ substanceId: 'copper-sulfate', amount: 1, state: 'aqueous' }
			])?.id
		).toBe('fe-cuso4');
	});

	it('Zn + 2 HCl → ZnCl₂ + H₂↑', () => {
		expect(
			findReaction([
				{ substanceId: 'Zn', amount: 1, state: 'solid' },
				{ substanceId: 'hydrochloric-acid', amount: 2, state: 'aqueous' }
			])?.id
		).toBe('zn-hcl');
	});

	it('Mg + 2 HCl → MgCl₂ + H₂↑', () => {
		expect(
			findReaction([
				{ substanceId: 'Mg', amount: 1, state: 'solid' },
				{ substanceId: 'hydrochloric-acid', amount: 2, state: 'aqueous' }
			])?.id
		).toBe('mg-hcl');
	});
});

describe('findReaction — синтез', () => {
	it('2 H₂ + O₂ → 2 H₂O при зажигании', () => {
		expect(
			findReaction(
				[
					{ substanceId: 'hydrogen-gas', amount: 2, state: 'gas' },
					{ substanceId: 'oxygen-gas', amount: 1, state: 'gas' }
				],
				{ temperature: 900 }
			)?.id
		).toBe('h2-o2-water');
	});

	it('Габер: N₂ + 3 H₂ + Fe-катализатор + давление + температура', () => {
		const r = findReaction(
			[
				{ substanceId: 'nitrogen-gas', amount: 1, state: 'gas' },
				{ substanceId: 'hydrogen-gas', amount: 3, state: 'gas' },
				{ substanceId: 'Fe', amount: 1, state: 'solid' }
			],
			{ temperature: 700, pressure: 2e7 }
		);
		expect(r?.id).toBe('haber-process');
	});

	it('Габер без катализатора → null', () => {
		const r = findReaction(
			[
				{ substanceId: 'nitrogen-gas', amount: 1, state: 'gas' },
				{ substanceId: 'hydrogen-gas', amount: 3, state: 'gas' }
			],
			{ temperature: 700, pressure: 2e7 }
		);
		expect(r).toBeNull();
	});
});

describe('findReaction — разложение', () => {
	it('CaCO₃ → CaO + CO₂ при сильном нагреве', () => {
		expect(
			findReaction([{ substanceId: 'calcium-carbonate', amount: 1, state: 'solid' }], {
				temperature: 1200
			})?.id
		).toBe('caco3-thermal');
	});

	it('CaCO₃ при комнатной температуре → null', () => {
		expect(
			findReaction([{ substanceId: 'calcium-carbonate', amount: 1, state: 'solid' }], {
				temperature: 298
			})
		).toBeNull();
	});

	it('H₂O₂ + MnO₂ катализатор → H₂O + O₂', () => {
		expect(
			findReaction(
				[
					{ substanceId: 'hydrogen-peroxide', amount: 2, state: 'aqueous' },
					{ substanceId: 'manganese-dioxide', amount: 1, state: 'solid' }
				],
				{ medium: 'water' }
			)?.id
		).toBe('h2o2-mno2-decomp');
	});

	it('H₂O₂ без MnO₂ → null', () => {
		expect(
			findReaction([{ substanceId: 'hydrogen-peroxide', amount: 2, state: 'aqueous' }])
		).toBeNull();
	});
});

describe('findReaction — окраска пламени', () => {
	it('Na в пламени → жёлтое свечение', () => {
		expect(
			findReaction([{ substanceId: 'Na', amount: 1, state: 'solid' }], { temperature: 1000 })?.id
		).toBe('flame-test-na');
	});

	it('K в пламени → фиолетовое', () => {
		expect(
			findReaction([{ substanceId: 'K', amount: 1, state: 'solid' }], { temperature: 1000 })?.id
		).toBe('flame-test-k');
	});

	it('Cu в пламени → зелёное', () => {
		expect(
			findReaction([{ substanceId: 'Cu', amount: 1, state: 'solid' }], { temperature: 1000 })?.id
		).toBe('flame-test-cu');
	});
});

describe('findReaction — отрицательные кейсы (CLAUDE.md «не выдумываем»)', () => {
	it('два неконфликтующих вещества → null', () => {
		expect(
			findReaction([
				{ substanceId: 'water', amount: 1, state: 'liquid' },
				{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' }
			])
		).toBeNull();
	});

	it('лишний реактив рядом с известной парой — exact-match не находит, fallback на правила', () => {
		// HCl + NaOH + дополнительно water: точного совпадения в БД нет (там 2 input'а, не 3),
		// но реакция нейтрализации химически верна — её и должен вернуть правиловый движок.
		// Помечена inferenceSource='rules', UI покажет соответствующий бейдж.
		const r = findReaction([
			{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' },
			{ substanceId: 'water', amount: 1, state: 'liquid' }
		]);
		expect(r?.inferenceSource).toBe('rules');
		expect(r?.category).toBe('neutralization');
	});

	it('инертная пара воды и соли (NaCl растворим) → null', () => {
		// Genuinely no reaction: вода + растворимая соль NaCl. Ни exact-match, ни правила.
		expect(
			findReaction([
				{ substanceId: 'water', amount: 1, state: 'liquid' },
				{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' }
			])
		).toBeNull();
	});

	it('правильные вещества, но неверное состояние HCl(g) вместо HCl(aq) → null', () => {
		expect(
			findReaction([
				{ substanceId: 'hydrochloric-acid', amount: 1, state: 'gas' },
				{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
			])
		).toBeNull();
	});

	it('пустой набор веществ → null', () => {
		expect(findReaction([])).toBeNull();
	});

	it('неизвестный substanceId → null', () => {
		expect(findReaction([{ substanceId: 'unobtanium', amount: 1 }])).toBeNull();
	});
});

describe('Целостность БД реакций', () => {
	it('у каждой реакции уникальный id', () => {
		expect(REACTION_BY_ID.size).toBe(REACTIONS.length);
	});

	it('все substance ID в inputs/outputs/catalyst существуют в SUBSTANCE_BY_ID', () => {
		for (const r of REACTIONS) {
			for (const i of r.inputs) {
				expect(
					SUBSTANCE_BY_ID.get(i.substanceId),
					`${r.id} inputs: ${i.substanceId}`
				).toBeDefined();
			}
			for (const o of r.outputs) {
				expect(
					SUBSTANCE_BY_ID.get(o.substanceId),
					`${r.id} outputs: ${o.substanceId}`
				).toBeDefined();
			}
			if (r.conditions.catalystId) {
				expect(
					SUBSTANCE_BY_ID.get(r.conditions.catalystId),
					`${r.id} catalyst: ${r.conditions.catalystId}`
				).toBeDefined();
			}
		}
	});

	it('у каждой реакции timeline начинается с t=0 и не убывает', () => {
		for (const r of REACTIONS) {
			expect(r.timeline.length).toBeGreaterThan(0);
			expect(r.timeline[0].t).toBe(0);
			for (let i = 1; i < r.timeline.length; i++) {
				expect(r.timeline[i].t).toBeGreaterThanOrEqual(r.timeline[i - 1].t);
			}
		}
	});

	it('REACTIONS_BY_KEY покрывает все реакции', () => {
		let covered = 0;
		for (const list of REACTIONS_BY_KEY.values()) covered += list.length;
		expect(covered).toBe(REACTIONS.length);
	});
});
