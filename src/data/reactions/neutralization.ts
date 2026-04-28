// Реакции нейтрализации: кислота + основание → соль + вода.
// Все экзотермические, идут в водной среде при комнатной температуре.

import type { Reaction } from '../types';

export const NEUTRALIZATION_REACTIONS: readonly Reaction[] = [
	{
		id: 'hcl-naoh',
		category: 'neutralization',
		inputs: [
			{ substanceId: 'hydrochloric-acid', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'sodium-chloride', amount: 1, state: 'aqueous' },
			{ substanceId: 'water', amount: 1, state: 'liquid' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 1.5,
		timeline: [
			{ t: 0, effects: [] },
			{
				t: 0.7,
				effects: [
					{ kind: 'temperature-rise', intensity: 0.5 },
					{ kind: 'color-shift', intensity: 0.3, color: '#ffffff' }
				]
			},
			{ t: 1.5, effects: [] }
		],
		equation: 'HCl + NaOH → NaCl + H₂O',
		description: {
			ru: 'Соляная кислота нейтрализует щёлочь — получается поваренная соль и вода. Реакция экзотермическая, раствор слегка нагревается.',
			en: 'Hydrochloric acid neutralizes the base — table salt and water form. Exothermic; solution warms up.'
		},
		glossaryRefs: ['acid', 'base', 'salt', 'neutralization'],
		difficulty: 'beginner',
		tags: ['classic', 'safe-for-school']
	},
	{
		id: 'h2so4-koh',
		category: 'neutralization',
		inputs: [
			{ substanceId: 'sulfuric-acid', amount: 1, state: 'aqueous' },
			{ substanceId: 'potassium-hydroxide', amount: 2, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'potassium-sulfate', amount: 1, state: 'aqueous' },
			{ substanceId: 'water', amount: 2, state: 'liquid' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 1.5,
		timeline: [
			{ t: 0, effects: [] },
			{ t: 0.7, effects: [{ kind: 'temperature-rise', intensity: 0.6 }] },
			{ t: 1.5, effects: [] }
		],
		equation: 'H₂SO₄ + 2 KOH → K₂SO₄ + 2 H₂O',
		description: {
			ru: 'Серная кислота с гидроксидом калия даёт сульфат калия и воду. Сильно экзотермическая.',
			en: 'Sulfuric acid with potassium hydroxide gives potassium sulfate and water. Strongly exothermic.'
		},
		glossaryRefs: ['acid', 'base', 'salt', 'neutralization'],
		difficulty: 'school',
		tags: ['classic']
	},
	{
		id: 'acetic-acid-naoh',
		category: 'neutralization',
		inputs: [
			{ substanceId: 'acetic-acid', amount: 1, state: 'aqueous' },
			{ substanceId: 'sodium-hydroxide', amount: 1, state: 'aqueous' }
		],
		outputs: [
			{ substanceId: 'sodium-acetate', amount: 1, state: 'aqueous' },
			{ substanceId: 'water', amount: 1, state: 'liquid' }
		],
		conditions: { medium: 'water' },
		reversible: false,
		duration: 1.5,
		timeline: [
			{ t: 0, effects: [] },
			{ t: 0.7, effects: [{ kind: 'temperature-rise', intensity: 0.3 }] },
			{ t: 1.5, effects: [] }
		],
		equation: 'CH₃COOH + NaOH → CH₃COONa + H₂O',
		description: {
			ru: 'Уксусная кислота (слабая) с щёлочью даёт ацетат натрия. Экзотермическая, но мягче чем с сильными кислотами.',
			en: 'Acetic acid (weak) with base gives sodium acetate. Exothermic but milder than with strong acids.'
		},
		glossaryRefs: ['acid', 'base', 'salt', 'neutralization'],
		difficulty: 'school',
		tags: ['classic']
	}
];
