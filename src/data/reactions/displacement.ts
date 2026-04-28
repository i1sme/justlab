// Реакции замещения (single displacement) — более активный металл вытесняет менее активный.
// Все идут в водном растворе при комнатной температуре.

import type { Reaction } from '../types';

export const DISPLACEMENT_REACTIONS: readonly Reaction[] = [
	{
		id: 'fe-cuso4',
		category: 'displacement',
		inputs: [
			{ substanceId: 'Fe', amount: 1, state: 'solid' },
			{ substanceId: 'copper-sulfate', amount: 1, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'iron-sulfate-ii', amount: 1, state: 'aqueous' },
			{ substanceId: 'Cu', amount: 1, state: 'solid' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 4,
		timeline: [
			{ t: 0, effects: [] },
			{ t: 1.5, effects: [{ kind: 'color-shift', intensity: 0.5, color: '#a5d6a7' }] },
			{
				t: 4,
				effects: [
					{ kind: 'precipitate', intensity: 0.7, color: '#c88033' },
					{ kind: 'color-shift', intensity: 0.8, color: '#a5d6a7' }
				]
			}
		],
		equation: 'Fe + CuSO₄ → FeSO₄ + Cu',
		description: {
			ru: 'Железный гвоздь в растворе медного купороса покрывается красной медью; синий раствор зеленеет — это сульфат железа (II).',
			en: 'An iron nail in copper sulfate solution gets coated with red copper; the blue solution turns green — that is iron(II) sulfate.'
		},
		glossaryRefs: ['reaction', 'redox', 'salt'],
		difficulty: 'school',
		tags: ['classic', 'safe-for-school']
	},
	{
		id: 'zn-hcl',
		category: 'displacement',
		inputs: [
			{ substanceId: 'Zn', amount: 1, state: 'solid' },
			{ substanceId: 'hydrochloric-acid', amount: 2, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'zinc-chloride', amount: 1, state: 'aqueous' },
			{ substanceId: 'hydrogen-gas', amount: 1, state: 'gas' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 3,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.5,
				effects: [
					{ kind: 'bubbles', intensity: 0.9, color: '#dbeafe' },
					{ kind: 'temperature-rise', intensity: 0.4 }
				]
			},
			{ t: 3, effects: [{ kind: 'bubbles', intensity: 0.5 }] }
		],
		equation: 'Zn + 2 HCl → ZnCl₂ + H₂↑',
		description: {
			ru: 'Цинк растворяется в соляной кислоте с активным выделением водорода. Классический школьный опыт.',
			en: 'Zinc dissolves in hydrochloric acid with vigorous hydrogen evolution. Classic school experiment.'
		},
		glossaryRefs: ['reaction', 'redox', 'acid'],
		difficulty: 'school',
		tags: ['classic', 'safe-for-school']
	},
	{
		id: 'mg-hcl',
		category: 'displacement',
		inputs: [
			{ substanceId: 'Mg', amount: 1, state: 'solid' },
			{ substanceId: 'hydrochloric-acid', amount: 2, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'magnesium-chloride', amount: 1, state: 'aqueous' },
			{ substanceId: 'hydrogen-gas', amount: 1, state: 'gas' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 2,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.3,
				effects: [
					{ kind: 'bubbles', intensity: 1, color: '#dbeafe' },
					{ kind: 'temperature-rise', intensity: 0.7 }
				]
			},
			{ t: 2, effects: [{ kind: 'bubbles', intensity: 0.3 }] }
		],
		equation: 'Mg + 2 HCl → MgCl₂ + H₂↑',
		description: {
			ru: 'Магний реагирует с соляной кислотой намного активнее цинка — бурное выделение водорода и заметное нагревание.',
			en: 'Magnesium reacts with HCl much more vigorously than zinc — rapid hydrogen evolution and noticeable warming.'
		},
		glossaryRefs: ['reaction', 'redox', 'acid'],
		difficulty: 'school',
		tags: ['classic']
	}
];
