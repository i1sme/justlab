// Реакции разложения: сложное → простые.

import type { Reaction } from '../types';

export const DECOMPOSITION_REACTIONS: readonly Reaction[] = [
	{
		id: 'caco3-thermal',
		category: 'decomposition',
		inputs: [{ substanceId: 'calcium-carbonate', amount: 1, state: 'solid' }],
		outputs: [
			{ substanceId: 'calcium-oxide', amount: 1, state: 'solid' },
			{ substanceId: 'carbon-dioxide', amount: 1, state: 'gas' }
		],
		conditions: { temperature: { min: 1100 } },
		reversible: false,
		duration: 5,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 2,
				effects: [
					{ kind: 'temperature-rise', intensity: 1 },
					{ kind: 'glow', intensity: 0.5, color: '#ff5500' }
				]
			},
			{ t: 5, effects: [{ kind: 'bubbles', intensity: 0.3 }] }
		],
		equation: 'CaCO₃ → CaO + CO₂',
		description: {
			ru: 'Термическое разложение известняка при сильном нагреве: получаем негашёную известь и углекислый газ. Так производят цемент.',
			en: 'Thermal decomposition of limestone at strong heating: yields quicklime and carbon dioxide. This is how cement is made.'
		},
		glossaryRefs: ['reaction'],
		difficulty: 'school',
		tags: ['industrial']
	},
	{
		id: 'h2o2-mno2-decomp',
		category: 'decomposition',
		inputs: [{ substanceId: 'hydrogen-peroxide', amount: 2, state: 'aqueous' }],
		outputs: [
			{ substanceId: 'water', amount: 2, state: 'liquid' },
			{ substanceId: 'oxygen-gas', amount: 1, state: 'gas' }
		],
		conditions: { catalystId: 'manganese-dioxide', medium: 'water' },
		reversible: false,
		duration: 4,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.3,
				effects: [
					{ kind: 'bubbles', intensity: 1, color: '#bfdbfe' },
					{ kind: 'temperature-rise', intensity: 0.4 }
				]
			},
			{ t: 4, effects: [{ kind: 'bubbles', intensity: 0.3 }] }
		],
		equation: '2 H₂O₂ → 2 H₂O + O₂↑',
		description: {
			ru: 'Перекись водорода в присутствии диоксида марганца разлагается с активным выделением кислорода. Катализатор не расходуется.',
			en: 'Hydrogen peroxide decomposes vigorously with manganese dioxide catalyst, releasing oxygen. The catalyst is not consumed.'
		},
		glossaryRefs: ['reaction', 'catalyst'],
		difficulty: 'school',
		tags: ['classic', 'safe-for-school']
	}
];
