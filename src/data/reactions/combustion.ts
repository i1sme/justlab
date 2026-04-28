// Реакции горения с кислородом. Требуют высокой температуры (зажигание).

import type { Reaction } from '../types';

export const COMBUSTION_REACTIONS: readonly Reaction[] = [
	{
		id: 'methane-combustion',
		category: 'combustion',
		inputs: [
			{ substanceId: 'methane', amount: 1, state: 'gas' },
			{ substanceId: 'oxygen-gas', amount: 2, state: 'gas' }
		],
		outputs: [
			{ substanceId: 'carbon-dioxide', amount: 1, state: 'gas' },
			{ substanceId: 'water', amount: 2, state: 'gas' }
		],
		conditions: { temperature: { min: 800 } },
		reversible: false,
		duration: 3,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.5,
				effects: [
					{ kind: 'flame', intensity: 0.9, color: '#3b82f6' },
					{ kind: 'temperature-rise', intensity: 1 }
				]
			},
			{ t: 3, effects: [{ kind: 'flame', intensity: 0.4, color: '#3b82f6' }] }
		],
		equation: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O',
		description: {
			ru: 'Горение метана — голубое пламя газовой плиты. Полное окисление: CO₂ и водяной пар.',
			en: 'Methane combustion — the blue flame of a gas stove. Complete oxidation: CO₂ and water vapor.'
		},
		glossaryRefs: ['reaction', 'redox'],
		difficulty: 'school',
		tags: ['classic', 'safe-for-school']
	},
	{
		id: 'magnesium-combustion',
		category: 'combustion',
		inputs: [
			{ substanceId: 'Mg', amount: 2, state: 'solid' },
			{ substanceId: 'oxygen-gas', amount: 1, state: 'gas' }
		],
		outputs: [{ substanceId: 'magnesium-oxide', amount: 2, state: 'solid' }],
		conditions: { temperature: { min: 900 } },
		reversible: false,
		duration: 2.5,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.4,
				effects: [
					{ kind: 'flame', intensity: 1, color: '#ffffff' },
					{ kind: 'glow', intensity: 1, color: '#ffffff' },
					{ kind: 'temperature-rise', intensity: 1 }
				]
			},
			{ t: 2.5, effects: [{ kind: 'precipitate', intensity: 0.7, color: '#fafafa' }] }
		],
		equation: '2 Mg + O₂ → 2 MgO',
		description: {
			ru: 'Горение магния — ослепительно-белое пламя. Образуется белый порошок оксида магния. Не смотреть прямо на пламя!',
			en: 'Magnesium combustion — blinding white flame. Forms white magnesium oxide powder. Do not look directly at the flame.'
		},
		glossaryRefs: ['reaction', 'redox'],
		difficulty: 'school',
		tags: ['classic', 'spectacular']
	},
	{
		id: 'carbon-combustion',
		category: 'combustion',
		inputs: [
			{ substanceId: 'C', amount: 1, state: 'solid' },
			{ substanceId: 'oxygen-gas', amount: 1, state: 'gas' }
		],
		outputs: [{ substanceId: 'carbon-dioxide', amount: 1, state: 'gas' }],
		conditions: { temperature: { min: 800 } },
		reversible: false,
		duration: 3,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.6,
				effects: [
					{ kind: 'flame', intensity: 0.7, color: '#ff8800' },
					{ kind: 'glow', intensity: 0.8, color: '#ff5500' }
				]
			},
			{ t: 3, effects: [] }
		],
		equation: 'C + O₂ → CO₂',
		description: {
			ru: 'Горение угля — оранжевое тление. При полном сгорании выделяется углекислый газ.',
			en: 'Carbon combustion — orange glow. Complete combustion releases carbon dioxide.'
		},
		glossaryRefs: ['reaction', 'redox'],
		difficulty: 'beginner',
		tags: ['classic']
	}
];
