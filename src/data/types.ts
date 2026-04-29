// Доменные типы фазы 0: Substance, Reaction, Experiment, Action.
// Это фундамент, на котором строится вся будущая лаборатория.
// Все правки этих типов — breaking changes; стараемся не трогать без нужды.
//
// См. ROADMAP / CLAUDE.md (раздел «Lab архитектура») для контекста.

import type { ElementCategory } from './elements';

// ============================================================
// Базовые перечисления
// ============================================================

/** Агрегатное состояние вещества. `aqueous` — растворённое в воде. */
export type Phase = 'solid' | 'liquid' | 'gas' | 'aqueous';

/** Что вещество представляет собой. */
export type SubstanceKind = 'element' | 'molecule' | 'mixture' | 'solution' | 'ion';

/** Уровень контента — связан с режимом пользователя (Новичок/Школа/Вуз). */
export type Difficulty = 'beginner' | 'school' | 'university';

/**
 * GHS-пиктограммы опасности (UN/ECE).
 * Используются для предупреждений в лаборатории перед опасной реакцией.
 */
export type GHSPictogram =
	| 'explosive' // GHS01 — взрывоопасно
	| 'flammable' // GHS02 — легковоспламеняющееся
	| 'oxidizing' // GHS03 — окислитель
	| 'compressed-gas' // GHS04 — сжатый газ
	| 'corrosive' // GHS05 — коррозийно
	| 'toxic' // GHS06 — токсично
	| 'harmful' // GHS07 — раздражает / вредно
	| 'health-hazard' // GHS08 — серьёзный риск для здоровья
	| 'environmental'; // GHS09 — опасно для окружающей среды

// ============================================================
// Substance
// ============================================================

/** Свойства вещества в конкретной фазе. Пустой объект — есть фаза, но без визуала. */
export interface PhaseStateData {
	/** CSS hex для рендера (пастельный для жидкости, насыщенный для твёрдого). */
	color?: string;
	/** Прозрачность 0..1 — для жидкости/газа. */
	opacity?: number;
	/** Плотность кг/м³ (для слоёв жидкостей в смесях). */
	density?: number;
	/** Удельная теплоёмкость Дж/(кг·К) — нужна, если симулируем нагрев. */
	specificHeat?: number;
}

/**
 * Унифицированное вещество: элемент, молекула, ион, смесь, раствор.
 * Все элементы и молекулы из текущей БД конвертируются в Substance через адаптеры.
 */
export interface Substance {
	/** Канонический ID (Fe, water, sulfuric-acid). По нему ищется в SUBSTANCE_BY_ID. */
	id: string;
	kind: SubstanceKind;
	/** Дисплейная формула (с подстрочными цифрами): H₂O, NaCl, C₆H₁₂O₆. */
	formula: string;
	/** SMILES — для молекул. */
	smiles?: string;
	/** Локализованные имена. Минимум — ru/en. */
	names: { ru: string; en: string };

	/** Свойства в каждой возможной фазе. Только нужные ключи присутствуют. */
	phases: Partial<Record<Phase, PhaseStateData>>;
	/** Фаза при стандартных условиях (T = 298 K, P = 101.3 кПа). */
	defaultPhase: Phase;

	/** Точка плавления (K). */
	meltingPoint?: number;
	/** Точка кипения (K). */
	boilingPoint?: number;
	/** Молярная масса (г/моль). */
	molarMass?: number;

	/** Цвет пламени при горении (для калия, натрия, меди, ...). CSS hex. */
	flameColor?: string;

	/** Категория элемента (если kind === 'element'), для UX-фильтрации. */
	elementCategory?: ElementCategory;
	/** Атомный номер (если элемент). */
	atomicNumber?: number;

	/** GHS-пиктограммы. */
	hazards?: readonly GHSPictogram[];

	/** Ссылки на термины глоссария — для TermLink в карточке вещества. */
	glossaryRefs?: readonly string[];

	/** Минимальный уровень, при котором вещество показывается. */
	difficulty: Difficulty;
}

// ============================================================
// Reaction
// ============================================================

/** Реактив или продукт реакции с указанием количества и (опционально) фазы. */
export interface ReactantSpec {
	substanceId: string;
	/** Стехиометрический коэффициент или абстрактное «N мер». */
	amount: number;
	/** Опциональный override defaultPhase — для случаев типа HCl(aq) vs HCl(g). */
	state?: Phase;
}

/** Условия, при которых реакция протекает. Все поля опциональные — заполняем то что важно. */
export interface ReactionConditions {
	/** Диапазон температуры (K), при которой реакция идёт. */
	temperature?: { min: number; max?: number };
	/** Давление (Па). */
	pressure?: number;
	/** ID вещества-катализатора. */
	catalystId?: string;
	/** Среда. */
	medium?: 'water' | 'air' | 'inert';
	/** Требуется ли освещение (например, фотолиз). */
	light?: boolean;
	/** Требуется ли электрический ток (электролиз). */
	electricCurrent?: boolean;
}

/** Тип визуального эффекта в кадре анимации реакции. */
export type VisualEffectKind =
	| 'bubbles'
	| 'smoke'
	| 'precipitate'
	| 'flame'
	| 'glow'
	| 'color-shift'
	| 'temperature-rise'
	| 'temperature-drop';

export interface VisualEffect {
	kind: VisualEffectKind;
	/** Интенсивность 0..1 — для частиц/яркости. */
	intensity: number;
	/** Цвет эффекта (для пламени/свечения/осадка). */
	color?: string;
	/** Длительность активного состояния (секунды). */
	duration?: number;
}

/**
 * Кадр-keyframe реакции. Между кадрами интерполируется. Используется «Машиной времени».
 * Кадры идут в порядке возрастания `t`.
 */
export interface ReactionFrame {
	/** Время с начала реакции (секунды). */
	t: number;
	/** Изменение температуры в этот момент (K). */
	deltaT?: number;
	/** Эффекты, активные в этом кадре. */
	effects?: readonly VisualEffect[];
	/**
	 * Снимок состава реакционной смеси в этот момент.
	 * Если не указан — UI интерполирует от inputs к outputs линейно.
	 */
	snapshot?: readonly ReactantSpec[];
}

export type ReactionCategory =
	| 'neutralization'
	| 'redox'
	| 'precipitation'
	| 'combustion'
	| 'flame-test'
	| 'displacement'
	| 'decomposition'
	| 'synthesis'
	| 'acid-base'
	| 'electrolysis'
	| 'dissolution';

/**
 * Источник реакции:
 *   - 'database' (или undefined) — точное совпадение в курируемой БД
 *   - 'rules' — выведена из общих правил (растворимость, ряд активности, нейтрализация).
 *     Это всё ещё проверяемая истина из учебника, но не «персональная» запись.
 *     UI показывает соответствующую пометку, чтобы пользователь видел разницу.
 */
export type ReactionInferenceSource = 'database' | 'rules';

export interface Reaction {
	id: string;
	category: ReactionCategory;

	inputs: readonly ReactantSpec[];
	outputs: readonly ReactantSpec[];
	conditions: ReactionConditions;
	/** Обратимая ли реакция (для динамического равновесия в будущем). */
	reversible: boolean;

	/** Полная длительность анимации реакции в UI (секунды). */
	duration: number;
	/** Keyframes для «Машины времени». Минимум — старт (t=0) и финал (t=duration). */
	timeline: readonly ReactionFrame[];

	/** Стандартное уравнение (LaTeX или просто текст): "HCl + NaOH → NaCl + H₂O". */
	equation: string;
	/** Локализованное человеческое описание. */
	description: { ru: string; en: string };

	/** Ссылки на термины глоссария — учебная подсказка. */
	glossaryRefs?: readonly string[];
	difficulty: Difficulty;
	/** Тэги: 'safe-for-school', 'spectacular', 'classic', ... */
	tags?: readonly string[];

	/** Откуда взялась реакция — БД или правиловый движок. По умолчанию 'database'. */
	inferenceSource?: ReactionInferenceSource;
}

// ============================================================
// Experiment / Lab state
// ============================================================

export type ContainerKind = 'test-tube' | 'beaker' | 'flask' | 'crucible' | 'petri';

/** Содержимое контейнера: вещество + количество + текущая фаза. */
export interface ContainerContent {
	substanceId: string;
	amount: number;
	phase: Phase;
}

export interface Container {
	id: string;
	kind: ContainerKind;
	/** Слот на столе (целое 0..N-1). Реальные пиксельные координаты вычисляет UI. */
	slotIndex: number;
	contents: ContainerContent[];
	/** Текущая температура содержимого (K). */
	temperature: number;
}

/**
 * Действие пользователя в лаборатории. Все Action'ы — иммутабельные записи в журнале.
 * Применение Action'а к LabState порождает новый LabState (event sourcing-style).
 */
export type Action =
	| {
			type: 'add-substance';
			containerId: string;
			substanceId: string;
			amount: number;
			t: number;
	  }
	| { type: 'mix'; sourceId: string; targetId: string; t: number }
	| { type: 'heat'; containerId: string; targetTemp: number; t: number }
	| { type: 'cool'; containerId: string; targetTemp: number; t: number }
	| { type: 'wait'; seconds: number; t: number }
	| { type: 'add-catalyst'; containerId: string; catalystId: string; t: number }
	| { type: 'add-container'; kind: ContainerKind; slotIndex: number; t: number }
	| { type: 'remove-container'; containerId: string; t: number };

/**
 * Запись эксперимента. Сериализуется в URL hash через lz-string (для шеринга)
 * и параллельно в IndexedDB (для журнала).
 *
 * `schemaVersion` поднимаем при breaking changes — миграция через типизированный реduceер.
 */
export interface Experiment {
	id: string;
	schemaVersion: 1;
	createdAt: number;
	updatedAt: number;
	containers: Container[];
	actions: Action[];
	environment: {
		temperature: number; // K, окружающая
		pressure: number; // Па
	};
}
