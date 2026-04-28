// Реакции синтеза: простые вещества → сложные.

import type { Reaction } from '../types';

export const SYNTHESIS_REACTIONS: readonly Reaction[] = [
	{
		id: 'h2-o2-water',
		category: 'synthesis',
		inputs: [
			{ substanceId: 'hydrogen-gas', amount: 2, state: 'gas' },
			{ substanceId: 'oxygen-gas', amount: 1, state: 'gas' }
		],
		outputs: [{ substanceId: 'water', amount: 2, state: 'gas' }],
		conditions: { temperature: { min: 800 } },
		reversible: false,
		duration: 1,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.2,
				effects: [
					{ kind: 'flame', intensity: 1, color: '#bfdbfe' },
					{ kind: 'temperature-rise', intensity: 1 }
				]
			},
			{ t: 1, effects: [] }
		],
		equation: '2 H₂ + O₂ → 2 H₂O',
		description: {
			ru: 'Гремучий газ — взрывное соединение водорода с кислородом. Сильно экзотермическая реакция, продукт — водяной пар.',
			en: 'Detonating gas — explosive combination of hydrogen and oxygen. Strongly exothermic; product is water vapor.'
		},
		glossaryRefs: ['reaction', 'redox'],
		difficulty: 'school',
		tags: ['classic', 'spectacular']
	},
	{
		id: 'haber-process',
		category: 'synthesis',
		inputs: [
			{ substanceId: 'nitrogen-gas', amount: 1, state: 'gas' },
			{ substanceId: 'hydrogen-gas', amount: 3, state: 'gas' }
		],
		outputs: [{ substanceId: 'ammonia', amount: 2, state: 'gas' }],
		conditions: {
			temperature: { min: 670, max: 770 },
			pressure: 2e7, // 20 МПа = 200 атм
			catalystId: 'Fe'
		},
		reversible: true,
		duration: 5,
		timeline: [
			{ t: 0, effects: [] },
			{ t: 2.5, effects: [{ kind: 'temperature-rise', intensity: 0.6 }] },
			{ t: 5, effects: [] }
		],
		equation: 'N₂ + 3 H₂ ⇌ 2 NH₃',
		description: {
			ru: 'Процесс Габера — промышленный синтез аммиака. Требует катализатора (железо), высокой температуры и давления. Обратимая реакция.',
			en: 'Haber process — industrial ammonia synthesis. Requires an iron catalyst, high temperature and pressure. Reversible reaction.'
		},
		glossaryRefs: ['reaction', 'catalyst'],
		difficulty: 'university',
		tags: ['industrial']
	}
];
