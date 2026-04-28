// Реакции осаждения и обмена с выпадением осадка.
// Все идут в водной среде; ключевой эффект — нерастворимый продукт.

import type { Reaction } from '../types';

export const PRECIPITATION_REACTIONS: readonly Reaction[] = [
	{
		id: 'agno3-nacl',
		category: 'precipitation',
		inputs: [
			{ substanceId: 'silver-nitrate', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'silver-chloride', amount: 1, state: 'solid' },
			{ substanceId: 'sodium-nitrate', amount: 1, state: 'aqueous' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 2,
		timeline: [
			{ t: 0, effects: [] },
			{ t: 0.5, effects: [{ kind: 'color-shift', intensity: 0.4, color: '#fafafa' }] },
			{ t: 2, effects: [{ kind: 'precipitate', intensity: 0.9, color: '#fafafa' }] }
		],
		equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
		description: {
			ru: 'Качественная реакция на хлорид-ион: серебро образует белый творожистый осадок хлорида серебра.',
			en: 'Qualitative test for chloride ion: silver forms a white curd-like precipitate of silver chloride.'
		},
		glossaryRefs: ['salt', 'reaction'],
		difficulty: 'school',
		tags: ['classic', 'qualitative-test']
	},
	{
		id: 'bacl2-na2so4',
		category: 'precipitation',
		inputs: [
			{ substanceId: 'barium-chloride', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-sulfate', amount: 1, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'barium-sulfate', amount: 1, state: 'solid' },
			{ substanceId: 'sodium-chloride', amount: 2, state: 'aqueous' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 2,
		timeline: [
			{ t: 0, effects: [] },
			{ t: 0.5, effects: [{ kind: 'color-shift', intensity: 0.4, color: '#ffffff' }] },
			{ t: 2, effects: [{ kind: 'precipitate', intensity: 1, color: '#ffffff' }] }
		],
		equation: 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2 NaCl',
		description: {
			ru: 'Качественная реакция на сульфат-ион: барий образует белый плотный осадок сульфата бария, нерастворимый в кислотах.',
			en: 'Qualitative test for sulfate ion: barium forms a dense white precipitate of barium sulfate, insoluble in acids.'
		},
		glossaryRefs: ['salt', 'reaction'],
		difficulty: 'school',
		tags: ['classic', 'qualitative-test']
	},
	{
		id: 'cuso4-naoh',
		category: 'precipitation',
		inputs: [
			{ substanceId: 'copper-sulfate', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-hydroxide', amount: 2, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'copper-hydroxide-ii', amount: 1, state: 'solid' },
			{ substanceId: 'sodium-sulfate', amount: 1, state: 'aqueous' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 2.5,
		timeline: [
			{ t: 0, effects: [] },
			{ t: 0.6, effects: [{ kind: 'color-shift', intensity: 0.5, color: '#3b82f6' }] },
			{ t: 2.5, effects: [{ kind: 'precipitate', intensity: 0.9, color: '#3b82f6' }] }
		],
		equation: 'CuSO₄ + 2 NaOH → Cu(OH)₂↓ + Na₂SO₄',
		description: {
			ru: 'Сульфат меди со щёлочью даёт голубой студенистый осадок гидроксида меди (II). Эффектная реакция.',
			en: 'Copper sulfate with base yields a blue gelatinous precipitate of copper(II) hydroxide. Visually striking.'
		},
		glossaryRefs: ['salt', 'base', 'reaction'],
		difficulty: 'school',
		tags: ['classic', 'spectacular']
	}
];
