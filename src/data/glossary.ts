// Курируемый глоссарий: базовые термины химии для новичков и школьников.
// Каждый термин: ключ + локализованное имя + краткое определение (1-2 предложения).
// Источник определений — упрощённые формулировки в духе школьного учебника.

export type GlossaryCategory = 'basics' | 'atom' | 'bond' | 'reaction' | 'thermo';

export interface GlossaryTerm {
	key: string;
	category: GlossaryCategory;
	term: { ru: string; en: string };
	definition: { ru: string; en: string };
}

export const GLOSSARY: readonly GlossaryTerm[] = [
	// === Основы ===
	{
		key: 'atom',
		category: 'basics',
		term: { ru: 'Атом', en: 'Atom' },
		definition: {
			ru: 'Наименьшая частица химического элемента, сохраняющая его свойства. Состоит из ядра и электронов.',
			en: 'The smallest particle of a chemical element that retains its properties. Consists of a nucleus and electrons.'
		}
	},
	{
		key: 'element',
		category: 'basics',
		term: { ru: 'Химический элемент', en: 'Chemical element' },
		definition: {
			ru: 'Вид атомов с одинаковым числом протонов в ядре. Каждый элемент — отдельная клетка в таблице Менделеева.',
			en: 'A type of atom with the same number of protons in its nucleus. Each element occupies its own cell in the periodic table.'
		}
	},
	{
		key: 'molecule',
		category: 'basics',
		term: { ru: 'Молекула', en: 'Molecule' },
		definition: {
			ru: 'Группа из двух или более атомов, связанных химическими связями. Может состоять из атомов одного или разных элементов.',
			en: 'A group of two or more atoms bonded together. Can be made of one element or several.'
		}
	},
	{
		key: 'compound',
		category: 'basics',
		term: { ru: 'Соединение', en: 'Compound' },
		definition: {
			ru: 'Вещество из двух или более разных элементов, соединённых в фиксированных пропорциях. Пример: вода H₂O.',
			en: 'A substance made of two or more different elements in fixed proportions. Example: water H₂O.'
		}
	},
	{
		key: 'mole',
		category: 'basics',
		term: { ru: 'Моль', en: 'Mole' },
		definition: {
			ru: 'Единица количества вещества: 1 моль = 6.022·10²³ частиц (число Авогадро). Удобна для пересчёта между массой и количеством атомов.',
			en: 'Unit of amount of substance: 1 mole = 6.022·10²³ particles (Avogadro number). Bridges mass and atom count.'
		}
	},

	// === Атом и электрон ===
	{
		key: 'atomic-number',
		category: 'atom',
		term: { ru: 'Атомный номер', en: 'Atomic number' },
		definition: {
			ru: 'Число протонов в ядре атома (Z). Однозначно определяет элемент: Z=1 — водород, Z=26 — железо.',
			en: 'Number of protons in the nucleus (Z). Uniquely identifies the element: Z=1 is hydrogen, Z=26 is iron.'
		}
	},
	{
		key: 'mass-number',
		category: 'atom',
		term: { ru: 'Массовое число', en: 'Mass number' },
		definition: {
			ru: 'Сумма протонов и нейтронов в ядре (A). Отличается у изотопов одного элемента.',
			en: 'Sum of protons and neutrons in the nucleus (A). Varies between isotopes of the same element.'
		}
	},
	{
		key: 'isotope',
		category: 'atom',
		term: { ru: 'Изотоп', en: 'Isotope' },
		definition: {
			ru: 'Разновидность атома одного элемента с разным числом нейтронов. Пример: ¹²C и ¹⁴C — изотопы углерода.',
			en: 'A variant of an element with a different number of neutrons. Example: ¹²C and ¹⁴C are isotopes of carbon.'
		}
	},
	{
		key: 'electron',
		category: 'atom',
		term: { ru: 'Электрон', en: 'Electron' },
		definition: {
			ru: 'Отрицательно заряженная частица, движущаяся вокруг ядра. Именно электроны участвуют в образовании химических связей.',
			en: 'A negatively charged particle orbiting the nucleus. Electrons are what form chemical bonds.'
		}
	},
	{
		key: 'proton',
		category: 'atom',
		term: { ru: 'Протон', en: 'Proton' },
		definition: {
			ru: 'Положительно заряженная частица в ядре. Число протонов задаёт элемент.',
			en: 'A positively charged particle in the nucleus. Their count defines the element.'
		}
	},
	{
		key: 'neutron',
		category: 'atom',
		term: { ru: 'Нейтрон', en: 'Neutron' },
		definition: {
			ru: 'Электрически нейтральная частица в ядре. Влияет на массу, но не на химические свойства.',
			en: 'An electrically neutral particle in the nucleus. Affects mass but not chemistry.'
		}
	},
	{
		key: 'electron-shell',
		category: 'atom',
		term: { ru: 'Электронная оболочка', en: 'Electron shell' },
		definition: {
			ru: 'Слой, на котором находятся электроны вокруг ядра. Каждая оболочка вмещает ограниченное число электронов: K=2, L=8, M=18 и т. д.',
			en: 'A layer of electrons around the nucleus. Each shell holds a fixed maximum: K=2, L=8, M=18, etc.'
		}
	},
	{
		key: 'orbital',
		category: 'atom',
		term: { ru: 'Орбиталь', en: 'Orbital' },
		definition: {
			ru: 'Область пространства, где вероятность найти электрон максимальна. Бывают s-, p-, d- и f-орбитали.',
			en: 'A region of space with the highest probability of finding an electron. Types: s, p, d, f.'
		}
	},
	{
		key: 'valence',
		category: 'atom',
		term: { ru: 'Валентность', en: 'Valence' },
		definition: {
			ru: 'Число химических связей, которые атом образует с другими атомами. Углерод обычно четырёхвалентен.',
			en: 'The number of bonds an atom forms with others. Carbon is typically tetravalent.'
		}
	},
	{
		key: 'oxidation-state',
		category: 'atom',
		term: { ru: 'Степень окисления', en: 'Oxidation state' },
		definition: {
			ru: 'Условный заряд атома в соединении, рассчитанный так, будто все связи ионные. Например, в H₂O у кислорода −2, у водорода +1.',
			en: 'The hypothetical charge of an atom assuming all bonds are ionic. In H₂O oxygen is −2, hydrogen is +1.'
		}
	},
	{
		key: 'ion',
		category: 'atom',
		term: { ru: 'Ион', en: 'Ion' },
		definition: {
			ru: 'Атом или группа атомов, потерявшая или принявшая электроны и поэтому имеющая электрический заряд.',
			en: 'An atom or group of atoms with a net charge from losing or gaining electrons.'
		}
	},
	{
		key: 'cation',
		category: 'atom',
		term: { ru: 'Катион', en: 'Cation' },
		definition: {
			ru: 'Положительно заряженный ион (электронов меньше, чем протонов). Пример: Na⁺.',
			en: 'A positively charged ion (fewer electrons than protons). Example: Na⁺.'
		}
	},
	{
		key: 'anion',
		category: 'atom',
		term: { ru: 'Анион', en: 'Anion' },
		definition: {
			ru: 'Отрицательно заряженный ион (электронов больше, чем протонов). Пример: Cl⁻.',
			en: 'A negatively charged ion (more electrons than protons). Example: Cl⁻.'
		}
	},

	// === Связи ===
	{
		key: 'chemical-bond',
		category: 'bond',
		term: { ru: 'Химическая связь', en: 'Chemical bond' },
		definition: {
			ru: 'Взаимодействие между атомами, удерживающее их вместе в молекуле или кристалле.',
			en: 'An interaction holding atoms together in a molecule or crystal.'
		}
	},
	{
		key: 'covalent-bond',
		category: 'bond',
		term: { ru: 'Ковалентная связь', en: 'Covalent bond' },
		definition: {
			ru: 'Связь, в которой два атома делят пару электронов. Преобладает в органике (CH₄, H₂O).',
			en: 'A bond where two atoms share an electron pair. Common in organics (CH₄, H₂O).'
		}
	},
	{
		key: 'ionic-bond',
		category: 'bond',
		term: { ru: 'Ионная связь', en: 'Ionic bond' },
		definition: {
			ru: 'Связь между катионом и анионом за счёт электростатического притяжения. Пример: NaCl (поваренная соль).',
			en: 'A bond between a cation and an anion via electrostatic attraction. Example: NaCl (table salt).'
		}
	},
	{
		key: 'hydrogen-bond',
		category: 'bond',
		term: { ru: 'Водородная связь', en: 'Hydrogen bond' },
		definition: {
			ru: 'Слабая связь между водородом, связанным с электроотрицательным атомом (O, N, F), и неподелённой парой соседа. Объясняет аномально высокую температуру кипения воды.',
			en: 'A weak attraction between hydrogen on an electronegative atom (O, N, F) and a lone pair on a neighbour. Explains water’s high boiling point.'
		}
	},

	// === Реакции ===
	{
		key: 'reaction',
		category: 'reaction',
		term: { ru: 'Химическая реакция', en: 'Chemical reaction' },
		definition: {
			ru: 'Превращение одних веществ в другие с образованием новых связей.',
			en: 'A transformation of substances into different ones, forming new bonds.'
		}
	},
	{
		key: 'redox',
		category: 'reaction',
		term: { ru: 'Окислительно-восстановительная реакция', en: 'Redox reaction' },
		definition: {
			ru: 'Реакция, в которой одни атомы теряют электроны (окисляются), а другие принимают (восстанавливаются). Горение, дыхание, ржавление — всё redox.',
			en: 'A reaction where some atoms lose electrons (oxidation) and others gain them (reduction). Burning, breathing, rusting — all redox.'
		}
	},
	{
		key: 'neutralization',
		category: 'reaction',
		term: { ru: 'Нейтрализация', en: 'Neutralization' },
		definition: {
			ru: 'Реакция кислоты со щёлочью с образованием соли и воды. HCl + NaOH → NaCl + H₂O.',
			en: 'Acid reacting with a base to form salt and water. HCl + NaOH → NaCl + H₂O.'
		}
	},
	{
		key: 'catalyst',
		category: 'reaction',
		term: { ru: 'Катализатор', en: 'Catalyst' },
		definition: {
			ru: 'Вещество, ускоряющее реакцию, но не расходующееся в ней. Биокатализаторы — ферменты — управляют обменом веществ.',
			en: 'A substance that speeds up a reaction without being consumed. Biological catalysts (enzymes) drive metabolism.'
		}
	},

	// === Свойства и измерения ===
	{
		key: 'molar-mass',
		category: 'thermo',
		term: { ru: 'Молярная масса', en: 'Molar mass' },
		definition: {
			ru: 'Масса одного моля вещества (г/моль). Численно равна сумме атомных масс в формуле.',
			en: 'Mass of one mole of substance (g/mol). Equals the sum of atomic masses in the formula.'
		}
	},
	{
		key: 'ph',
		category: 'thermo',
		term: { ru: 'pH', en: 'pH' },
		definition: {
			ru: 'Шкала кислотности раствора от 0 до 14: <7 — кислая среда, =7 — нейтральная, >7 — щелочная.',
			en: 'A scale of solution acidity from 0 to 14: <7 acidic, =7 neutral, >7 basic.'
		}
	},
	{
		key: 'acid',
		category: 'thermo',
		term: { ru: 'Кислота', en: 'Acid' },
		definition: {
			ru: 'Вещество, отдающее H⁺ или принимающее электронную пару. Кислые на вкус, реагируют с металлами и основаниями.',
			en: 'A substance that donates H⁺ or accepts an electron pair. Sour-tasting, reacts with metals and bases.'
		}
	},
	{
		key: 'base',
		category: 'thermo',
		term: { ru: 'Основание', en: 'Base' },
		definition: {
			ru: 'Вещество, принимающее H⁺ или отдающее электронную пару. Щёлочи (NaOH, KOH) — растворимые в воде основания.',
			en: 'A substance that accepts H⁺ or donates an electron pair. Alkalis (NaOH, KOH) are water-soluble bases.'
		}
	},
	{
		key: 'salt',
		category: 'thermo',
		term: { ru: 'Соль', en: 'Salt' },
		definition: {
			ru: 'Соединение из катиона металла (или NH₄⁺) и аниона кислотного остатка. Образуется при нейтрализации кислоты основанием.',
			en: 'A compound of a metal (or NH₄⁺) cation and an acid-residue anion. Formed by acid–base neutralization.'
		}
	}
];

export const GLOSSARY_CATEGORIES: readonly GlossaryCategory[] = [
	'basics',
	'atom',
	'bond',
	'reaction',
	'thermo'
];
