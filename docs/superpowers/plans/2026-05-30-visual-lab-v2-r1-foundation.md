# Visual Lab v2 — R1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Three.js visual lab with a 2.5D Canvas/SVG foundation — a master-detail layout (shelf of containers + a large workspace) where glassware renders as SVG silhouettes, a heating plate is a flat SVG panel with big readable controls, and reagent bottles are click-to-add. No reaction or ambient effects yet (those are R2/R3). The existing Three.js lab scene and 3D heating plate are deleted; the pure logic modules survive and relocate to `render2d/`.

**Architecture:** Pure geometry/logic modules (`glassware-profiles.ts`, `heating-plate-logic.ts`) move from `render3d/` to `render2d/` unchanged, gaining one new pure function — `glasswareSilhouette(kind, pxPerUnit)` — that turns a vessel profile into a symmetric closed SVG path (unit-tested). Svelte 5 components render the layout: `Glassware.svelte` (SVG vessel + clip-masked liquid), `HeatingPlatePanel.svelte` (flat apparatus), `Shelf.svelte` (selectable miniatures), `BottlePanel.svelte` (click-to-add reagents), `Workspace.svelte` (selected container large + apparatus + per-container controls), all composed by a rewritten `VisualLabView.svelte`. All state flows through the existing `$lib/lab` store; components are "dumb" render + callbacks. A pastel palette is defined once as CSS custom properties on the root and inherited by children. Substance colors stay scientifically accurate (from `Substance.phases[].color`).

**Tech Stack:** Svelte 5 Runes, SVG, TypeScript strict, Vitest. No Three.js in the lab path. No new dependencies.

---

## File structure

**Relocated (R1 Task 1, `git mv`, content unchanged except Task 2's addition):**
- `src/lib/render3d/glassware-profiles.ts` → `src/lib/render2d/glassware-profiles.ts`
- `src/lib/render3d/glassware-profiles.test.ts` → `src/lib/render2d/glassware-profiles.test.ts`
- `src/lib/render3d/heating-plate-logic.ts` → `src/lib/render2d/heating-plate-logic.ts`
- `src/lib/render3d/heating-plate-logic.test.ts` → `src/lib/render2d/heating-plate-logic.test.ts`

**Deleted (R1 Task 1):**
- `src/lib/render3d/lab-scene.ts`
- `src/lib/render3d/heating-plate.ts`

**Created:**
- `src/lib/ui/lab2d/Glassware.svelte` — one SVG vessel + liquid. Responsibility: draw a single container.
- `src/lib/ui/lab2d/HeatingPlatePanel.svelte` — flat apparatus panel. Responsibility: temperature device UI.
- `src/lib/ui/lab2d/Shelf.svelte` — horizontal strip of selectable container miniatures.
- `src/lib/ui/lab2d/BottlePanel.svelte` — vertical reagent list, click-to-add.
- `src/lib/ui/lab2d/Workspace.svelte` — selected container large + apparatus + per-container controls.

**Rewritten:**
- `src/lib/ui/VisualLabView.svelte` — composes the above; owns the pastel palette root; wires the lab store.

**Modified:**
- `src/lib/i18n/ru.json`, `src/lib/i18n/en.json` — add `lab.visual.empty` and `lab.visual.shelf` keys.

No reducer / store / domain-type changes. The existing `ContainerToolbar` (add/remove containers) stays above the view in `/lab/+page.svelte` and works for both modes — the shelf is **selection-only**.

---

## Task 1: Relocate pure modules, retire 3D lab, placeholder VisualLabView

This is the cutover task. After it, the build is green, the visual lab shows a temporary placeholder, the pure modules live in `render2d/` with their tests passing, and nothing imports Three.js for the lab. Subsequent tasks build the real UI on top.

**Files:**
- Move: 4 files (see above)
- Delete: `src/lib/render3d/lab-scene.ts`, `src/lib/render3d/heating-plate.ts`
- Rewrite: `src/lib/ui/VisualLabView.svelte`

- [ ] **Step 1: Relocate the four pure-module files with git mv**

Run:
```bash
git mv src/lib/render3d/glassware-profiles.ts src/lib/render2d/glassware-profiles.ts
git mv src/lib/render3d/glassware-profiles.test.ts src/lib/render2d/glassware-profiles.test.ts
git mv src/lib/render3d/heating-plate-logic.ts src/lib/render2d/heating-plate-logic.ts
git mv src/lib/render3d/heating-plate-logic.test.ts src/lib/render2d/heating-plate-logic.test.ts
```

The test files import the modules with relative paths (`./glassware-profiles`, `./heating-plate-logic`) and the modules import `../../data/types` — both relative depths are identical between `render3d/` and `render2d/` (both are `src/lib/<dir>/`), so no import edits are needed inside the moved files.

- [ ] **Step 2: Delete the two Three.js lab modules**

Run:
```bash
git rm src/lib/render3d/lab-scene.ts src/lib/render3d/heating-plate.ts
```

- [ ] **Step 3: Replace `VisualLabView.svelte` with a placeholder**

Overwrite `src/lib/ui/VisualLabView.svelte` entirely with:

```svelte
<script lang="ts">
	// Визуальный режим лаборатории (2.5D, перестройка R1+).
	// На время R1 здесь временная заглушка — реальная сцена (полка + рабочая зона)
	// собирается в последующих задачах R1. 3D-сцена (Three.js) выведена из проекта.
	import { t } from '$lib/i18n';
</script>

<div class="visual-lab-placeholder" role="status">
	<p>{t('lab.visual.rebuilding')}</p>
</div>

<style>
	.visual-lab-placeholder {
		display: grid;
		place-items: center;
		min-height: 360px;
		border-radius: 1rem;
		background: #f5efe6;
		color: #5b6b78;
		font-size: 0.9rem;
		text-align: center;
		padding: 2rem;
	}
	@media (prefers-color-scheme: dark) {
		.visual-lab-placeholder {
			background: #1f242b;
			color: #a8b8c3;
		}
	}
</style>
```

- [ ] **Step 4: Add the placeholder i18n key**

In `src/lib/i18n/ru.json`, find the `"visual"` object inside `"lab"`:

```json
		"visual": {
			"canvasLabel": "3D-сцена лаборатории",
```

Insert a new key right after the opening brace:

```json
		"visual": {
			"rebuilding": "Визуальная лаборатория перестраивается — скоро здесь появится новый интерфейс.",
			"canvasLabel": "3D-сцена лаборатории",
```

In `src/lib/i18n/en.json`, find:

```json
		"visual": {
			"canvasLabel": "3D lab scene",
```

Insert:

```json
		"visual": {
			"rebuilding": "The visual lab is being rebuilt — a new interface is coming soon.",
			"canvasLabel": "3D lab scene",
```

- [ ] **Step 5: Verify and commit**

Run: `npm run format && npm run check && npm run lint && npm run test:unit -- --run && npm run build && npm run test:e2e`
Expected:
- check: `0 ERRORS 0 WARNINGS` (confirms no dangling imports of the deleted modules)
- lint: clean
- unit: all pass — the relocated `glassware-profiles.test.ts` and `heating-plate-logic.test.ts` run from their new path (test count unchanged from main)
- build: `✔ done`
- e2e: 11 passed (visual mode isn't exercised by e2e; the placeholder is inert)

If `check` reports an unused import or missing module, confirm Step 1–3 removed every reference to `$lib/render3d/lab-scene`, `$lib/render3d/heating-plate`, `$lib/render3d/glassware-profiles`, and `$lib/render3d/heating-plate-logic`. Search:
```bash
grep -rn "render3d/lab-scene\|render3d/heating-plate\|render3d/glassware-profiles\|render3d/heating-plate-logic" src/
```
This must return nothing.

Commit:
```bash
git add -A
git commit -m "visual lab v2: retire 3D scene, relocate pure modules to render2d, placeholder view"
```

---

## Task 2: SVG silhouette path generator (pure, TDD)

Add one pure function to the relocated `glassware-profiles.ts` that converts a vessel profile into a symmetric closed SVG path in pixel space, plus its bounding size. This is the geometric core of 2.5D glassware rendering.

**Files:**
- Modify: `src/lib/render2d/glassware-profiles.ts`
- Test: `src/lib/render2d/glassware-profiles.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/render2d/glassware-profiles.test.ts` (add `glasswareSilhouette` to the existing import from `./glassware-profiles`, then add this describe block at the end of the file):

```ts
describe('glasswareSilhouette', () => {
	it('возвращает закрытый SVG-путь, начинающийся с M и заканчивающийся Z', () => {
		for (const kind of KINDS) {
			const { path } = glasswareSilhouette(kind, 600);
			expect(path.startsWith('M ')).toBe(true);
			expect(path.trim().endsWith('Z')).toBe(true);
			expect(path.length).toBeGreaterThan(10);
		}
	});

	it('ширина = 2 × максимальный радиус × pxPerUnit', () => {
		// beaker: maxR = 0.19 → width = 2*0.19*600 = 228
		const { widthPx } = glasswareSilhouette('beaker', 600);
		expect(widthPx).toBeCloseTo(228, 1);
	});

	it('высота = полная высота профиля × pxPerUnit', () => {
		// test-tube: height units = 0.46 → 0.46*600 = 276
		const { heightPx } = glasswareSilhouette('test-tube', 600);
		expect(heightPx).toBeCloseTo(0.46 * 600, 1);
	});

	it('путь симметричен: содержит как положительные, так и отрицательные смещения от центра', () => {
		// Для несимметричной проверки берём колбу: после прохода вверх по правой стороне
		// путь должен вернуться вниз по левой (x меньше центра).
		const { path, widthPx } = glasswareSilhouette('flask', 600);
		const cx = widthPx / 2;
		// Извлекаем все x-координаты команд L и M.
		const xs = [...path.matchAll(/[ML] (-?\d+(?:\.\d+)?) /g)].map((m) => Number(m[1]));
		expect(xs.some((x) => x > cx + 1)).toBe(true); // правая сторона
		expect(xs.some((x) => x < cx - 1)).toBe(true); // левая сторона
	});

	it('масштаб линеен по pxPerUnit', () => {
		const a = glasswareSilhouette('crucible', 300);
		const b = glasswareSilhouette('crucible', 600);
		expect(b.widthPx).toBeCloseTo(a.widthPx * 2, 3);
		expect(b.heightPx).toBeCloseTo(a.heightPx * 2, 3);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:unit -- --run src/lib/render2d/glassware-profiles.test.ts`
Expected: FAIL — `glasswareSilhouette is not exported` / `is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/render2d/glassware-profiles.ts` (after the existing `liquidRadius` function):

```ts
/** Силуэт сосуда в SVG: симметричный замкнутый путь + размер в пикселях. */
export interface GlasswareSilhouette {
	/** SVG-атрибут `d`: контур сосуда (право-низ → верх → лево-низ → Z). */
	path: string;
	/** Полная ширина bbox в пикселях (2 × максимальный радиус × pxPerUnit). */
	widthPx: number;
	/** Полная высота bbox в пикселях (высота профиля × pxPerUnit). */
	heightPx: number;
}

/**
 * Построить силуэт сосуда для 2.5D-рендера. Профиль (r, y) зеркалится через вертикальную ось,
 * y инвертируется (в SVG ось Y растёт вниз). Результат — замкнутый путь, который можно
 * залить (стекло) и использовать как clipPath для жидкости.
 */
export function glasswareSilhouette(kind: ContainerKind, pxPerUnit: number): GlasswareSilhouette {
	const pts = glasswareProfile(kind);
	const heightUnits = glasswareHeight(kind);
	const maxR = pts.reduce((m, p) => Math.max(m, p.r), 0);
	const widthPx = maxR * 2 * pxPerUnit;
	const heightPx = heightUnits * pxPerUnit;
	const cx = widthPx / 2;
	const sx = (r: number): string => (cx + r * pxPerUnit).toFixed(2);
	const sy = (y: number): string => ((heightUnits - y) * pxPerUnit).toFixed(2);

	// Старт в нижней точке оси, проход вверх по правой стороне.
	let d = `M ${sx(0)} ${sy(0)}`;
	for (const p of pts) d += ` L ${sx(p.r)} ${sy(p.y)}`;
	// Возврат вниз по левой стороне (зеркало), сверху вниз.
	for (let i = pts.length - 1; i >= 0; i--) d += ` L ${sx(-pts[i].r)} ${sy(pts[i].y)}`;
	d += ' Z';

	return { path: d, widthPx, heightPx };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:unit -- --run src/lib/render2d/glassware-profiles.test.ts`
Expected: PASS — all assertions green (existing glassware tests + the 5 new silhouette tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/render2d/glassware-profiles.ts src/lib/render2d/glassware-profiles.test.ts
git commit -m "glassware: pure SVG silhouette generator for 2.5D rendering"
```

---

## Task 3: Glassware.svelte component

Render one container as an SVG vessel with a clip-masked liquid fill in the content color.

**Files:**
- Create: `src/lib/ui/lab2d/Glassware.svelte`

- [ ] **Step 1: Write the component**

Create `src/lib/ui/lab2d/Glassware.svelte`:

```svelte
<script lang="ts">
	// Один сосуд как SVG-силуэт + залитая жидкость (clip-mask по контуру).
	// Цвет жидкости — научно достоверный, из Substance.phases[phase].color.
	// Чистая геометрия силуэта — в render2d/glassware-profiles.ts (покрыта тестами).

	import type { Container } from '../../../data/types';
	import { findSubstance } from '../../../data/substances';
	import {
		glasswareSilhouette,
		glasswareHeight,
		liquidFillHeight
	} from '$lib/render2d/glassware-profiles';

	type Props = {
		container: Container;
		/** Высота рендера в пикселях; ширина выводится из пропорций сосуда. */
		heightPx?: number;
	};
	let { container, heightPx = 280 }: Props = $props();

	// pxPerUnit подбирается так, чтобы самый высокий сосуд (≈0.46) влез в heightPx.
	const pxPerUnit = $derived(heightPx / glasswareHeight(container.kind));
	const silo = $derived(glasswareSilhouette(container.kind, pxPerUnit));
	const clipId = $derived(`glass-clip-${container.id}`);

	const total = $derived(container.contents.reduce((s, x) => s + x.amount, 0));
	const fillRatio = $derived(Math.min(1, total / 4));
	const fillPx = $derived(liquidFillHeight(container.kind, fillRatio) * pxPerUnit);

	const liquidColor = $derived.by(() => {
		if (container.contents.length === 0) return null;
		const top = container.contents[container.contents.length - 1];
		const sub = findSubstance(top.substanceId);
		return sub?.phases[top.phase]?.color ?? '#a8c8e8';
	});
</script>

<svg
	class="glassware"
	width={silo.widthPx}
	height={silo.heightPx}
	viewBox="0 0 {silo.widthPx} {silo.heightPx}"
	role="img"
	aria-label={container.kind}
>
	<defs>
		<clipPath id={clipId}>
			<path d={silo.path} />
		</clipPath>
	</defs>

	<!-- Жидкость: прямоугольник снизу, обрезанный по контуру сосуда. -->
	{#if liquidColor && fillPx > 0}
		<rect
			x="0"
			y={silo.heightPx - fillPx}
			width={silo.widthPx}
			height={fillPx}
			fill={liquidColor}
			opacity="0.8"
			clip-path="url(#{clipId})"
		/>
	{/if}

	<!-- Стекло: контур поверх жидкости. -->
	<path
		d={silo.path}
		fill="var(--lab-glass-fill, rgba(220,234,242,0.25))"
		stroke="var(--lab-glass-stroke, #a8b8c3)"
		stroke-width="2"
		stroke-linejoin="round"
	/>
</svg>

<style>
	.glassware {
		display: block;
		overflow: visible;
	}
</style>
```

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: `0 ERRORS 0 WARNINGS`. (The component is not yet imported anywhere; this only confirms it compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/ui/lab2d/Glassware.svelte
git commit -m "visual lab v2: Glassware SVG component (vessel + clipped liquid)"
```

---

## Task 4: HeatingPlatePanel.svelte component

A flat apparatus panel: НАГРЕВ label, a large digital display reading the selected container's temperature, and four big buttons (O / I / II / III). It does not dispatch actions itself — it calls an `onIntensity` callback. The active button is **derived from the container's current temperature** (so it's always truthful and never goes stale across container switches).

**Files:**
- Create: `src/lib/ui/lab2d/HeatingPlatePanel.svelte`

- [ ] **Step 1: Write the component**

Create `src/lib/ui/lab2d/HeatingPlatePanel.svelte`:

```svelte
<script lang="ts">
	// Плоская «нагревательная плитка»: панель НАГРЕВ + цифровой дисплей + кнопки O/I/II/III.
	// Целевые температуры и активный уровень — из чистого модуля heating-plate-logic.
	// Активная кнопка ВЫВОДИТСЯ из температуры контейнера (нет устаревшего UI-состояния).

	import type { Container } from '../../../data/types';
	import {
		INTENSITY_TARGETS,
		LEVELS,
		type HeatingIntensity
	} from '$lib/render2d/heating-plate-logic';
	import { t } from '$lib/i18n';

	type Props = {
		container: Container | null;
		onIntensity: (level: HeatingIntensity) => void;
	};
	let { container, onIntensity }: Props = $props();

	const LABELS: Record<HeatingIntensity, string> = { 0: 'O', 1: 'I', 2: 'II', 3: 'III' };

	// Активный уровень: тот, чья целевая T совпадает с текущей T контейнера (±0.5 K).
	// Если пользователь подстроил T кнопками −/+ к непресетному значению — активного нет.
	const activeLevel = $derived.by(() => {
		if (!container) return null;
		return LEVELS.find((l) => Math.abs(INTENSITY_TARGETS[l] - container.temperature) < 0.5) ?? null;
	});

	function tempText(): string {
		if (!container) return '—';
		const k = Math.round(container.temperature);
		const c = Math.round(container.temperature - 273.15);
		return `${k} K · ${c} °C`;
	}
</script>

<div class="plate" class:plate--disabled={!container}>
	<div class="plate-label">{t('lab.heater.label')}</div>
	<div class="plate-display" aria-live="polite">{tempText()}</div>
	<div class="plate-buttons" role="group" aria-label={t('lab.heater.label')}>
		{#each LEVELS as level (level)}
			<button
				type="button"
				class="plate-btn"
				class:plate-btn--active={activeLevel === level}
				disabled={!container}
				aria-pressed={activeLevel === level}
				aria-label={`${t('lab.heater.levelPrefix')} ${LABELS[level]}`}
				onclick={() => onIntensity(level)}
			>
				{LABELS[level]}
			</button>
		{/each}
	</div>
</div>

<style>
	.plate {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--lab-apparatus, #5b6b78);
		min-width: 9rem;
	}
	.plate--disabled {
		opacity: 0.6;
	}
	.plate-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--lab-hot, #e8a87c);
		text-align: center;
	}
	.plate-display {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.95rem;
		text-align: center;
		color: #ff8c5a;
		background: #14181d;
		border-radius: 0.375rem;
		padding: 0.4rem 0.5rem;
	}
	.plate-buttons {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.3rem;
	}
	.plate-btn {
		aspect-ratio: 1;
		border-radius: 0.375rem;
		font-weight: 700;
		font-size: 0.85rem;
		color: #e8eef3;
		background: #3a3f4a;
		transition: background-color 100ms ease;
	}
	.plate-btn:hover:not(:disabled) {
		background: #4a505c;
	}
	.plate-btn--active {
		background: var(--lab-hot, #e8a87c);
		color: #2a1a10;
	}
	.plate-btn:disabled {
		cursor: not-allowed;
	}
</style>
```

- [ ] **Step 2: Add the heater i18n keys**

In `src/lib/i18n/ru.json`, inside the `"lab"` object, find the `"heatStep"` / `"coolStep"` keys (they exist near the temperature controls) and add a sibling `"heater"` object right after `"coolStep"`. The `"coolStep"` line looks like:

```json
			"coolStep": "−25 K",
```

Insert after it:

```json
			"coolStep": "−25 K",
			"heater": {
				"label": "НАГРЕВ",
				"levelPrefix": "Уровень нагрева"
			},
```

In `src/lib/i18n/en.json`, find:

```json
			"coolStep": "−25 K",
```

Insert after it:

```json
			"coolStep": "−25 K",
			"heater": {
				"label": "НАГРЕВ",
				"levelPrefix": "Heating level"
			},
```

(The label «НАГРЕВ» stays Russian in both locales — it's a brand-style device label per the spec §3.5 / §8.)

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/lab2d/HeatingPlatePanel.svelte src/lib/i18n/ru.json src/lib/i18n/en.json
git commit -m "visual lab v2: HeatingPlatePanel (flat apparatus, derived active level)"
```

---

## Task 5: Shelf.svelte and BottlePanel.svelte components

The shelf is a horizontal strip of selectable container miniatures (reusing `Glassware` small). The bottle panel is a vertical list of curated reagents; clicking one calls `onPick`.

**Files:**
- Create: `src/lib/ui/lab2d/Shelf.svelte`
- Create: `src/lib/ui/lab2d/BottlePanel.svelte`

- [ ] **Step 1: Write Shelf.svelte**

Create `src/lib/ui/lab2d/Shelf.svelte`:

```svelte
<script lang="ts">
	// Полка: горизонтальная лента миниатюр контейнеров. Клик = выбор.
	// Добавление/удаление контейнеров — в существующем ContainerToolbar (выше view), не здесь.
	import type { Container } from '../../../data/types';
	import Glassware from './Glassware.svelte';
	import { t } from '$lib/i18n';

	type Props = {
		containers: readonly Container[];
		selectedId: string | null;
		onSelect: (id: string) => void;
	};
	let { containers, selectedId, onSelect }: Props = $props();

	function tempDot(k: number): string {
		// Тёплый/холодный цветовой код точки-индикатора.
		if (k >= 373) return '#e8a87c';
		if (k <= 273) return '#a8dadc';
		return '#bfd7ed';
	}
</script>

<div class="shelf" role="listbox" aria-label={t('lab.visual.shelf')}>
	{#each containers as c (c.id)}
		<button
			type="button"
			class="shelf-item"
			class:shelf-item--selected={selectedId === c.id}
			role="option"
			aria-selected={selectedId === c.id}
			title={`${t(`lab.containerKind.${c.kind}`)} · ${c.id}`}
			onclick={() => onSelect(c.id)}
		>
			<div class="shelf-mini">
				<Glassware container={c} heightPx={64} />
			</div>
			<span class="shelf-dot" style:background-color={tempDot(c.temperature)}></span>
		</button>
	{/each}
</div>

<style>
	.shelf {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding: 0.5rem;
		border-radius: 0.75rem;
		background: var(--lab-wall, #e7eef3);
	}
	.shelf-item {
		position: relative;
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 72px;
		height: 84px;
		border-radius: 0.5rem;
		border: 2px solid transparent;
		background: transparent;
		transition: border-color 120ms ease;
	}
	.shelf-item:hover {
		border-color: var(--lab-focus, #bfd7ed);
	}
	.shelf-item--selected {
		border-color: #6aa0d8;
		background: rgba(191, 215, 237, 0.4);
	}
	.shelf-mini {
		pointer-events: none;
	}
	.shelf-dot {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	@media (prefers-color-scheme: dark) {
		.shelf {
			background: #232a31;
		}
	}
</style>
```

- [ ] **Step 2: Write BottlePanel.svelte**

Create `src/lib/ui/lab2d/BottlePanel.svelte`:

```svelte
<script lang="ts">
	// Панель реактивов: вертикальный список бутылок. Клик = добавить 1 меру в выбранный контейнер.
	// Кнопки задизейблены, пока контейнер не выбран (как в существующем Inventory).
	import { findSubstance } from '../../../data/substances';
	import { getLocale, t } from '$lib/i18n';

	type Props = {
		substanceIds: readonly string[];
		canPick: boolean;
		onPick: (substanceId: string) => void;
	};
	let { substanceIds, canPick, onPick }: Props = $props();

	const locale = $derived(getLocale());
</script>

<div class="bottles">
	<div class="bottles-title">{t('lab.inventory')}</div>
	<ul class="bottles-list">
		{#each substanceIds as id (id)}
			{@const sub = findSubstance(id)}
			{#if sub}
				<li>
					<button
						type="button"
						class="bottle"
						disabled={!canPick}
						onclick={() => onPick(id)}
						title={sub.names[locale]}
					>
						<span class="bottle-cap" style:background-color={sub.phases[sub.defaultPhase]?.color ?? '#cbd5e1'}></span>
						<span class="bottle-name">{sub.names[locale]}</span>
						<span class="bottle-formula">{sub.formula}</span>
					</button>
				</li>
			{/if}
		{/each}
	</ul>
</div>

<style>
	.bottles {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 11rem;
	}
	.bottles-title {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--lab-text, #3a3f4a);
		opacity: 0.7;
	}
	.bottles-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.bottle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.4rem 0.6rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.6);
		text-align: left;
		transition: background-color 100ms ease;
	}
	.bottle:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.95);
	}
	.bottle:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.bottle-cap {
		flex: 0 0 auto;
		width: 0.9rem;
		height: 1.3rem;
		border-radius: 0.2rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
	}
	.bottle-name {
		flex: 1 1 auto;
		font-size: 0.8rem;
		color: var(--lab-text, #3a3f4a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.bottle-formula {
		flex: 0 0 auto;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.75rem;
		opacity: 0.7;
		color: var(--lab-text, #3a3f4a);
	}
	@media (prefers-color-scheme: dark) {
		.bottle {
			background: rgba(255, 255, 255, 0.08);
		}
		.bottle:hover:not(:disabled) {
			background: rgba(255, 255, 255, 0.16);
		}
		.bottle-name,
		.bottle-formula,
		.bottles-title {
			color: #dce4ea;
		}
	}
</style>
```

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/lab2d/Shelf.svelte src/lib/ui/lab2d/BottlePanel.svelte
git commit -m "visual lab v2: Shelf (selectable miniatures) + BottlePanel (click-to-add)"
```

---

## Task 6: Workspace.svelte and rewired VisualLabView.svelte

`Workspace` shows the selected container large with per-container controls (−/+/empty/remove) and the heating panel. `VisualLabView` composes shelf + workspace + bottle panel, owns the pastel palette root, and wires everything to the lab store. This replaces the Task 1 placeholder.

**Files:**
- Create: `src/lib/ui/lab2d/Workspace.svelte`
- Rewrite: `src/lib/ui/VisualLabView.svelte`

- [ ] **Step 1: Write Workspace.svelte**

Create `src/lib/ui/lab2d/Workspace.svelte`:

```svelte
<script lang="ts">
	// Рабочая зона: крупный выбранный контейнер + контролы (−/+/очистить/удалить) + плитка.
	import type { Container } from '../../../data/types';
	import type { HeatingIntensity } from '$lib/render2d/heating-plate-logic';
	import Glassware from './Glassware.svelte';
	import HeatingPlatePanel from './HeatingPlatePanel.svelte';
	import { t } from '$lib/i18n';

	type Props = {
		container: Container | null;
		onHeat: (deltaK: number) => void;
		onIntensity: (level: HeatingIntensity) => void;
		onEmpty: () => void;
		onRemove: () => void;
	};
	let { container, onHeat, onIntensity, onEmpty, onRemove }: Props = $props();
</script>

<div class="workspace">
	{#if container}
		<div class="ws-vessel">
			<Glassware {container} heightPx={300} />
		</div>

		<div class="ws-controls">
			<div class="ws-temp-controls" role="group" aria-label={t('lab.temperature')}>
				<button type="button" class="ws-btn" aria-label={t('lab.coolStep')} onclick={() => onHeat(-25)}>−</button>
				<button type="button" class="ws-btn" aria-label={t('lab.heatStep')} onclick={() => onHeat(25)}>+</button>
				<button
					type="button"
					class="ws-btn ws-btn--empty"
					aria-label={t('lab.emptyContainer')}
					disabled={container.contents.length === 0}
					onclick={onEmpty}
				>
					⌫
				</button>
				<button type="button" class="ws-btn ws-btn--remove" aria-label={t('lab.removeContainer')} onclick={onRemove}>✕</button>
			</div>

			<HeatingPlatePanel {container} {onIntensity} />
		</div>
	{:else}
		<div class="ws-empty" role="status">{t('lab.visual.empty')}</div>
	{/if}
</div>

<style>
	.workspace {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: center;
		gap: 1.5rem;
		min-height: 340px;
		padding: 1rem;
	}
	.ws-vessel {
		display: grid;
		place-items: end center;
	}
	.ws-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.ws-temp-controls {
		display: flex;
		gap: 0.3rem;
	}
	.ws-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.4rem;
		font-weight: 600;
		color: var(--lab-text, #3a3f4a);
		background: rgba(255, 255, 255, 0.6);
		transition: background-color 100ms ease;
	}
	.ws-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.95);
	}
	.ws-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.ws-btn--empty {
		color: #c0563f;
	}
	.ws-btn--remove {
		color: #7a828c;
	}
	.ws-empty {
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 300px;
		font-size: 0.9rem;
		color: var(--lab-text, #5b6b78);
		opacity: 0.7;
	}
	@media (prefers-color-scheme: dark) {
		.ws-btn {
			background: rgba(255, 255, 255, 0.08);
			color: #dce4ea;
		}
		.ws-btn:hover:not(:disabled) {
			background: rgba(255, 255, 255, 0.16);
		}
	}
</style>
```

- [ ] **Step 2: Rewrite VisualLabView.svelte**

Overwrite `src/lib/ui/VisualLabView.svelte` entirely with:

```svelte
<script lang="ts">
	// Визуальный режим лаборатории (2.5D). Master-detail: полка сверху + рабочая зона снизу.
	// Состояние — из $lib/lab. Компоненты «тупые»: рисуют + зовут колбэки.
	// Палитра (пастель) задаётся CSS-переменными на корне и наследуется детьми.
	// Цвета веществ при этом остаются научно достоверными (из Substance.phases[].color).

	import {
		isHeatingAction,
		targetTemperatureFor,
		type HeatingIntensity
	} from '$lib/render2d/heating-plate-logic';
	import {
		addSubstance,
		emptyContainer,
		getExperiment,
		getSelectedContainerId,
		heat,
		removeContainer,
		setSelectedContainerId
	} from '$lib/lab';
	import Shelf from './lab2d/Shelf.svelte';
	import Workspace from './lab2d/Workspace.svelte';
	import BottlePanel from './lab2d/BottlePanel.svelte';

	// Курируемый набор бутылок (как в прежней 3D-версии — ходовые реактивы).
	const BOTTLE_IDS: readonly string[] = [
		'water',
		'hydrochloric-acid',
		'sodium-hydroxide',
		'copper-sulfate',
		'silver-nitrate',
		'sodium-chloride',
		'Zn'
	];

	const experiment = $derived(getExperiment());
	const selectedId = $derived(getSelectedContainerId());
	const selected = $derived(experiment.containers.find((c) => c.id === selectedId) ?? null);

	function selectContainer(id: string): void {
		setSelectedContainerId(selectedId === id ? null : id);
	}

	function pickBottle(substanceId: string): void {
		if (!selectedId) return;
		addSubstance(selectedId, substanceId, 1);
	}

	function applyIntensity(level: HeatingIntensity): void {
		if (!selected) return;
		const action = isHeatingAction(level, selected.temperature);
		if (action === 'noop') return;
		heat(selected.id, targetTemperatureFor(level) - selected.temperature);
	}
</script>

<div class="visual-lab-v2">
	<Shelf containers={experiment.containers} {selectedId} onSelect={selectContainer} />

	<div class="lab-body">
		<BottlePanel substanceIds={BOTTLE_IDS} canPick={selectedId !== null} onPick={pickBottle} />

		<div class="lab-stage">
			<Workspace
				container={selected}
				onHeat={(d) => selected && heat(selected.id, d)}
				onIntensity={applyIntensity}
				onEmpty={() => selected && emptyContainer(selected.id)}
				onRemove={() => selected && removeContainer(selected.id)}
			/>
		</div>
	</div>
</div>

<style>
	.visual-lab-v2 {
		/* Пастельная палитра — единый источник, наследуется детьми через CSS custom properties. */
		--lab-table: #f5efe6;
		--lab-wall: #e7eef3;
		--lab-glass-stroke: #a8b8c3;
		--lab-glass-fill: rgba(220, 234, 242, 0.25);
		--lab-apparatus: #5b6b78;
		--lab-hot: #e8a87c;
		--lab-cold: #a8dadc;
		--lab-text: #3a3f4a;
		--lab-focus: #bfd7ed;

		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-radius: 1rem;
		padding: 0.75rem;
		background: var(--lab-table);
	}
	.lab-body {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: stretch;
	}
	.lab-stage {
		flex: 1 1 22rem;
		border-radius: 0.75rem;
		background: var(--lab-wall);
	}
	@media (prefers-color-scheme: dark) {
		.visual-lab-v2 {
			--lab-table: #1f242b;
			--lab-wall: #232a31;
			--lab-glass-stroke: #5b6b78;
			--lab-glass-fill: rgba(120, 150, 170, 0.18);
			--lab-text: #dce4ea;
		}
	}
</style>
```

- [ ] **Step 3: Add the remaining i18n keys**

In `src/lib/i18n/ru.json`, find the `"rebuilding"` key added in Task 1 and add two siblings after it:

```json
			"rebuilding": "Визуальная лаборатория перестраивается — скоро здесь появится новый интерфейс.",
			"empty": "Выбери контейнер на полке, чтобы начать работу.",
			"shelf": "Полка с контейнерами",
```

In `src/lib/i18n/en.json`, find the `"rebuilding"` key and add:

```json
			"rebuilding": "The visual lab is being rebuilt — a new interface is coming soon.",
			"empty": "Pick a container from the shelf to start working.",
			"shelf": "Container shelf",
```

(The `rebuilding` key is now unused but harmless — leave it; removing it is optional cleanup.)

- [ ] **Step 4: Format, type-check, unit, build**

Run: `npm run format && npm run check && npm run test:unit -- --run && npm run build`
Expected: format clean; check `0 ERRORS 0 WARNINGS`; unit all pass; build `✔ done`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui/lab2d/Workspace.svelte src/lib/ui/VisualLabView.svelte src/lib/i18n/ru.json src/lib/i18n/en.json
git commit -m "visual lab v2: Workspace + composed VisualLabView (shelf+workspace+bottles)"
```

---

## Task 7: Full regression verification + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Run the full gate**

Run: `npm run check && npm run lint && npm run test:unit -- --run && npm run build && npm run test:e2e`
Expected:
- check: 0 errors, 0 warnings
- lint: prettier + eslint clean
- unit: all pass (existing + the 5 new `glasswareSilhouette` tests; relocated tests run from `render2d/`)
- build: `✔ done`
- e2e: 11 passed (e2e does not exercise the visual toggle, so the rebuilt view is not asserted — but navigation to `/lab` must not error)

- [ ] **Step 2: Confirm no orphaned Three.js lab references**

Run:
```bash
grep -rn "lab-scene\|render3d/heating-plate\|mountLabScene\|makeHeatingPlate" src/
```
Expected: nothing (the atom-scene / molecule-scene in `render3d/` are unrelated and must NOT appear in this grep since the pattern is lab-specific).

- [ ] **Step 3: Manual visual smoke (human-only)**

Run `npm run dev`, open `/lab`, switch to the Visual toggle (🧪). Confirm:
- A shelf of 4 container miniatures appears on top; clicking one selects it (powder-blue border).
- The selected container renders large in the workspace as a recognizable vessel silhouette (beaker vs flask vs test-tube vs crucible are visually distinct).
- The bottle panel lists 7 reagents with color caps + formulae; buttons are disabled until a container is selected.
- Clicking a bottle (with a container selected) adds liquid — the vessel shows a colored fill at a believable level; CuSO₄ is blue, not pastel-washed.
- The heating panel shows «НАГРЕВ», a digital display reading the selected container's temperature, and O/I/II/III buttons. Clicking II sets the temperature to 700 K (visible in the display and in the formal-mode card); clicking O returns to 298 K. The active button is highlighted.
- The −/+ buttons fine-tune temperature by 25 K; ⌫ empties; ✕ removes the container.
- Adding/removing containers via the existing toolbar above the view updates the shelf.
- The overall palette is calm/pastel while the substance colors remain vivid and accurate.

This step has no automated assertion — it is the human visual check before declaring R1 done.

---

## Notes for the implementer

- **Do not** implement reaction effects, ambient effects (boiling/steam/dissolution/settling), drag-and-drop, or background atmosphere — those are R2/R3/R4. R1 is the static, interactive foundation only.
- The `ContainerToolbar` (add/remove containers) already lives above the view in `/lab/+page.svelte` and works in both modes — **do not** duplicate add/remove into the shelf.
- Formal mode (`ContainerCard` etc.) is untouched and remains available via the existing toggle.
- Substance colors come from `Substance.phases[phase].color` and must render at full saturation — the pastel palette is chrome only (background, glass outline, apparatus, text), never applied to liquids.
- All styling pixel/color values are starter values — tune them during the Step-3 manual smoke. The component structure, props, and store wiring are the load-bearing parts.
- Svelte 5 runes only: `$props()`, `$derived()`, `$derived.by()`, callback props (NOT `createEventDispatcher`).
- The `liquidRadius` export added in 6b3 is still used by nothing in R1 (the SVG liquid uses a clip-masked rect, not a radius) — leave it; R3's effects or a future faithful-liquid pass may use it.
