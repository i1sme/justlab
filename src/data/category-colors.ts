// Палитра категорий элементов — единый источник цветов для 2D-таблицы,
// 3D-сцены, легенды. Цвета подобраны для контраста с тёмным текстом
// (Material Design tone 200/300).

import type { ElementCategory } from './elements';

export const CATEGORY_COLORS: Readonly<Record<ElementCategory, string>> = {
	'alkali-metal': '#FF8A65',
	'alkaline-earth-metal': '#FFB74D',
	'transition-metal': '#F06292',
	'post-transition-metal': '#90A4AE',
	metalloid: '#AED581',
	nonmetal: '#81C784',
	halogen: '#FFF176',
	'noble-gas': '#81D4FA',
	lanthanoid: '#BA68C8',
	actinoid: '#E57373'
};

/** Порядок категорий для отображения в легенде. */
export const CATEGORY_ORDER: readonly ElementCategory[] = [
	'alkali-metal',
	'alkaline-earth-metal',
	'transition-metal',
	'post-transition-metal',
	'metalloid',
	'nonmetal',
	'halogen',
	'noble-gas',
	'lanthanoid',
	'actinoid'
];
