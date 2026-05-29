# Glassware Toolkit (6b3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder cylinders in the visual lab with a parameterised glassware factory that renders five vessel shapes (beaker, Erlenmeyer flask, test-tube, crucible, petri dish) from data-driven profiles, each with an adjustable liquid surface.

**Architecture:** A pure, three-free module (`glassware-profiles.ts`) holds all geometry math — wall profiles per `ContainerKind`, interior radius at a height, liquid fill height — and is fully unit-tested. The Three.js render layer (`lab-scene.ts`) consumes those numbers via `THREE.LatheGeometry` and a scaled unit-cylinder liquid mesh. Shape is a **data parameter**, never a subclass (the universal-primitive principle from the roadmap spec).

**Tech Stack:** Svelte 5, Three.js (LatheGeometry, CylinderGeometry), TypeScript strict, Vitest.

---

## File structure

- **Create** `src/lib/render3d/glassware-profiles.ts` — pure geometry: `glasswareProfile`, `glasswareHeight`, `radiusAtHeight`, `interiorRadiusAt`, `liquidFillHeight`. No three import. One responsibility: vessel geometry math.
- **Create** `src/lib/render3d/glassware-profiles.test.ts` — Vitest unit tests for the pure module.
- **Modify** `src/lib/render3d/lab-scene.ts` — add `makeGlassware()`, replace `makePlaceholderContainer()` usage and delete it, rewrite `updateContainerVisual()` to use the pure helpers.

The reducer, store, and `Container` type are unchanged — `container.kind` already exists (`'test-tube' | 'beaker' | 'flask' | 'crucible' | 'petri'`).

---

## Task 1: Pure glassware-profiles module (TDD)

**Files:**

- Create: `src/lib/render3d/glassware-profiles.ts`
- Test: `src/lib/render3d/glassware-profiles.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/render3d/glassware-profiles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	glasswareProfile,
	glasswareHeight,
	radiusAtHeight,
	interiorRadiusAt,
	liquidFillHeight,
	WALL_THICKNESS
} from './glassware-profiles';
import type { ContainerKind } from '../../data/types';

const KINDS: ContainerKind[] = ['beaker', 'flask', 'test-tube', 'crucible', 'petri'];

describe('glasswareProfile', () => {
	it('каждый профиль начинается на оси (закрытое дно) и монотонен по высоте', () => {
		for (const kind of KINDS) {
			const pts = glasswareProfile(kind);
			expect(pts.length).toBeGreaterThanOrEqual(2);
			expect(pts[0].r).toBe(0);
			for (let i = 1; i < pts.length; i++) {
				expect(pts[i].y).toBeGreaterThanOrEqual(pts[i - 1].y);
			}
		}
	});

	it('колба (flask) сужается кверху: верхний радиус меньше базового', () => {
		const pts = glasswareProfile('flask');
		const baseR = Math.max(...pts.map((p) => p.r));
		const topR = pts[pts.length - 1].r;
		expect(topR).toBeLessThan(baseR);
	});

	it('стакан (beaker) почти цилиндр: верх ≈ база', () => {
		const pts = glasswareProfile('beaker');
		const baseR = pts[1].r;
		const topR = pts[pts.length - 1].r;
		expect(Math.abs(topR - baseR)).toBeLessThan(0.05);
	});

	it('чашка Петри ниже стакана, пробирка выше стакана', () => {
		expect(glasswareHeight('petri')).toBeLessThan(glasswareHeight('beaker'));
		expect(glasswareHeight('test-tube')).toBeGreaterThan(glasswareHeight('beaker'));
	});
});

describe('radiusAtHeight / interiorRadiusAt', () => {
	it('стакан: радиус постоянен по высоте стенки', () => {
		expect(radiusAtHeight('beaker', 0.1)).toBeCloseTo(0.18, 5);
		expect(radiusAtHeight('beaker', 0.2)).toBeCloseTo(0.18, 5);
	});

	it('внутренний радиус меньше внешнего ровно на толщину стенки', () => {
		const y = 0.1;
		expect(interiorRadiusAt('beaker', y)).toBeCloseTo(radiusAtHeight('beaker', y) - WALL_THICKNESS, 5);
	});

	it('внутренний радиус никогда не отрицателен', () => {
		for (const kind of KINDS) {
			for (let y = 0; y <= glasswareHeight(kind); y += 0.05) {
				expect(interiorRadiusAt(kind, y)).toBeGreaterThanOrEqual(0);
			}
		}
	});
});

describe('liquidFillHeight', () => {
	it('0 при fillRatio=0, растёт, и оставляет headroom ниже края', () => {
		for (const kind of KINDS) {
			expect(liquidFillHeight(kind, 0)).toBe(0);
			const full = liquidFillHeight(kind, 1);
			expect(full).toBeGreaterThan(0);
			expect(full).toBeLessThan(glasswareHeight(kind));
			expect(liquidFillHeight(kind, 0.5)).toBeLessThan(full);
		}
	});

	it('клампит fillRatio за пределами 0..1', () => {
		expect(liquidFillHeight('beaker', -1)).toBe(0);
		expect(liquidFillHeight('beaker', 5)).toBe(liquidFillHeight('beaker', 1));
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:unit -- --run src/lib/render3d/glassware-profiles.test.ts`
Expected: FAIL — `Failed to resolve import './glassware-profiles'` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/render3d/glassware-profiles.ts`:

```ts
// Чистая геометрия посуды: профиль стенки (для LatheGeometry) и размеры жидкости.
// Никакого three здесь — только числа, чтобы покрыть юнит-тестами (render отделён от логики).
// Форма — это ДАННЫЕ (параметр kind), не подкласс. См. roadmap-spec, принцип «данные + контракт».

import type { ContainerKind } from '../../data/types';

/** Точка профиля стенки: r — радиус от оси, y — высота от дна. Координаты в сцена-юнитах. */
export interface ProfilePoint {
	r: number;
	y: number;
}

/** Толщина стенки сосуда — вычитается из внешнего радиуса для расчёта объёма жидкости. */
export const WALL_THICKNESS = 0.012;

/** Доля высоты, до которой наливаем максимум (оставляем место у края). */
const FILL_HEADROOM = 0.9;

/**
 * Профиль внешней стенки сосуда для THREE.LatheGeometry.
 * Первая точка на оси (r=0) — при вращении даёт закрытое дно; верх открыт (последняя точка r>0).
 */
export function glasswareProfile(kind: ContainerKind): ProfilePoint[] {
	switch (kind) {
		case 'beaker':
			// Прямой цилиндр с лёгким носиком-сливом.
			return [
				{ r: 0, y: 0 },
				{ r: 0.18, y: 0 },
				{ r: 0.18, y: 0.32 },
				{ r: 0.19, y: 0.34 }
			];
		case 'flask':
			// Коническая колба Эрленмейера: широкое основание → узкое горло.
			return [
				{ r: 0, y: 0 },
				{ r: 0.22, y: 0 },
				{ r: 0.22, y: 0.06 },
				{ r: 0.07, y: 0.3 },
				{ r: 0.06, y: 0.3 },
				{ r: 0.06, y: 0.42 }
			];
		case 'test-tube':
			// Узкий цилиндр со скруглённым дном.
			return [
				{ r: 0, y: 0 },
				{ r: 0.035, y: 0.006 },
				{ r: 0.06, y: 0.025 },
				{ r: 0.07, y: 0.06 },
				{ r: 0.07, y: 0.46 }
			];
		case 'crucible':
			// Приземистый усечённый конус, расширяющийся кверху.
			return [
				{ r: 0, y: 0 },
				{ r: 0.1, y: 0 },
				{ r: 0.16, y: 0.18 }
			];
		case 'petri':
			// Очень низкая широкая чашка.
			return [
				{ r: 0, y: 0 },
				{ r: 0.26, y: 0 },
				{ r: 0.26, y: 0.06 }
			];
	}
}

/** Полная высота сосуда (максимальный y профиля). */
export function glasswareHeight(kind: ContainerKind): number {
	return glasswareProfile(kind).reduce((max, p) => Math.max(max, p.y), 0);
}

/** Внешний радиус стенки на высоте y (линейная интерполяция по профилю). */
export function radiusAtHeight(kind: ContainerKind, y: number): number {
	const pts = glasswareProfile(kind);
	if (y <= pts[0].y) return pts[0].r;
	for (let i = 1; i < pts.length; i++) {
		if (y <= pts[i].y) {
			const a = pts[i - 1];
			const b = pts[i];
			const span = b.y - a.y;
			if (span <= 0) return b.r;
			const t = (y - a.y) / span;
			return a.r + (b.r - a.r) * t;
		}
	}
	return pts[pts.length - 1].r;
}

/** Внутренний радиус (под жидкость) на высоте y: внешний минус толщина стенки, не ниже 0. */
export function interiorRadiusAt(kind: ContainerKind, y: number): number {
	return Math.max(0, radiusAtHeight(kind, y) - WALL_THICKNESS);
}

/** Высота поверхности жидкости при заполнении fillRatio (0..1, клампится). */
export function liquidFillHeight(kind: ContainerKind, fillRatio: number): number {
	const clamped = Math.max(0, Math.min(1, fillRatio));
	return glasswareHeight(kind) * FILL_HEADROOM * clamped;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:unit -- --run src/lib/render3d/glassware-profiles.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/render3d/glassware-profiles.ts src/lib/render3d/glassware-profiles.test.ts
git commit -m "glassware profiles: pure geometry module + tests"
```

---

## Task 2: Render glassware in lab-scene

**Files:**

- Modify: `src/lib/render3d/lab-scene.ts`

- [ ] **Step 1: Add imports**

At the top of `src/lib/render3d/lab-scene.ts`, the existing imports are:

```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Container } from '../../data/types';
import { findSubstance } from '../../data/substances';
```

Change them to:

```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Container, ContainerKind } from '../../data/types';
import { findSubstance } from '../../data/substances';
import {
	glasswareProfile,
	interiorRadiusAt,
	liquidFillHeight
} from './glassware-profiles';
```

- [ ] **Step 2: Add the `makeGlassware` factory**

In `src/lib/render3d/lab-scene.ts`, find the existing function `makePlaceholderContainer` (it starts with `function makePlaceholderContainer(reducedQuality: boolean, containerId: string): THREE.Group {`). Replace that entire function with:

```ts
function makeGlassware(
	kind: ContainerKind,
	reducedQuality: boolean,
	containerId: string
): THREE.Group {
	const group = new THREE.Group();
	group.userData = { kind: KIND_CONTAINER, containerId };

	const segments = reducedQuality ? 24 : 48;

	// Стекло — LatheGeometry профиля стенки (форма зависит от kind = данные).
	const profile = glasswareProfile(kind).map((p) => new THREE.Vector2(p.r, p.y));
	const glassGeo = new THREE.LatheGeometry(profile, segments);
	const glassMat = new THREE.MeshStandardMaterial({
		color: 0xcfeaf5,
		transparent: true,
		opacity: 0.3,
		roughness: 0.08,
		metalness: 0.0,
		side: THREE.DoubleSide
	});
	const glass = new THREE.Mesh(glassGeo, glassMat);
	glass.name = 'glass';
	group.add(glass);

	// Жидкость — единичный цилиндр (r=1, h=1), масштабируется в updateContainerVisual.
	const liquidGeo = new THREE.CylinderGeometry(1, 1, 1, segments);
	const liquidMat = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0,
		roughness: 0.4
	});
	const liquid = new THREE.Mesh(liquidGeo, liquidMat);
	liquid.name = 'liquid';
	liquid.visible = false;
	group.add(liquid);

	// Кольцо выделения — синее свечение у основания (управляется applySelectionHighlight).
	const ringGeo = new THREE.RingGeometry(0.24, 0.3, segments);
	const ringMat = new THREE.MeshBasicMaterial({
		color: 0x2563eb,
		transparent: true,
		opacity: 0.8,
		side: THREE.DoubleSide,
		depthWrite: false
	});
	const ring = new THREE.Mesh(ringGeo, ringMat);
	ring.rotation.x = -Math.PI / 2;
	ring.position.y = 0.002;
	ring.name = 'selectionRing';
	ring.visible = false;
	group.add(ring);

	return group;
}
```

- [ ] **Step 3: Update the rebuild loop to call `makeGlassware`**

In `src/lib/render3d/lab-scene.ts`, inside `rebuildContainers`, find:

```ts
			if (!mesh) {
				mesh = makePlaceholderContainer(reducedQuality, c.id);
				scene.add(mesh);
				containerMeshes.set(c.id, mesh);
				clickableObjects.push(mesh);
			}
```

Replace with:

```ts
			if (!mesh) {
				mesh = makeGlassware(c.kind, reducedQuality, c.id);
				scene.add(mesh);
				containerMeshes.set(c.id, mesh);
				clickableObjects.push(mesh);
			}
```

- [ ] **Step 4: Rewrite `updateContainerVisual`**

In `src/lib/render3d/lab-scene.ts`, find the existing `updateContainerVisual` function (starts `function updateContainerVisual(group: THREE.Object3D, c: Container): void {`) and replace the entire function with:

```ts
function updateContainerVisual(group: THREE.Object3D, c: Container): void {
	const liquid = group.getObjectByName('liquid') as THREE.Mesh | undefined;
	if (!liquid) return;

	if (c.contents.length === 0) {
		liquid.visible = false;
		return;
	}

	const total = c.contents.reduce((s, x) => s + x.amount, 0);
	const fillRatio = Math.min(1, total / 4); // 4 «единицы» = полный сосуд
	const fillH = liquidFillHeight(c.kind, fillRatio);
	if (fillH <= 0) {
		liquid.visible = false;
		return;
	}

	// Радиус столба жидкости — внутренний радиус на середине высоты столба.
	const radius = Math.max(0.02, interiorRadiusAt(c.kind, fillH * 0.5));

	// Цвет — по «верхнему» (последнему добавленному) компоненту.
	const top = c.contents[c.contents.length - 1];
	const sub = findSubstance(top.substanceId);
	const color = sub?.phases[top.phase]?.color ?? '#a8c8e8';
	const mat = liquid.material as THREE.MeshStandardMaterial;
	mat.color.set(color);
	mat.opacity = 0.8;
	mat.needsUpdate = true;

	// Единичный цилиндр → масштаб под фактические радиус/высоту.
	liquid.scale.set(radius, fillH, radius);
	liquid.position.y = fillH / 2 + 0.005;
	liquid.visible = true;
}
```

- [ ] **Step 5: Format, type-check, and build**

Run: `npm run format && npm run check && npm run build`
Expected:
- format: writes/leaves files clean (no error)
- check: `COMPLETED ... 0 ERRORS 0 WARNINGS`
- build: `✓ built` and `✔ done`

If `check` reports an unused symbol error for `makePlaceholderContainer`, confirm Step 2 fully replaced it (the old function name must no longer appear). Search: `grep -n makePlaceholderContainer src/lib/render3d/lab-scene.ts` should return nothing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/render3d/lab-scene.ts
git commit -m "visual lab: parameterised glassware replaces placeholder cylinders"
```

---

## Task 3: Full regression verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full gate**

Run: `npm run check && npm run lint && npm run test:unit -- --run && npm run build && npm run test:e2e`
Expected:
- check: 0 errors, 0 warnings
- lint: "All matched files use Prettier code style!" and no eslint errors
- unit: all tests pass (130 existing + new glassware-profiles tests)
- build: `✔ done`
- e2e: 11 passed

- [ ] **Step 2: Manual smoke (visual confirmation)**

Run: `npm run dev`, open `/lab`, switch to the Visual toggle (🧪). Confirm:
- Each starter container renders as a distinct vessel (2 beakers, 1 test-tube, 1 crucible).
- Adding a reagent (select a flask → click a bottle) fills it with coloured liquid at a believable level.
- The "Add" toolbar can spawn a flask / petri and they render with the correct distinct shape.
- No z-fighting at the base; selection ring still appears under the chosen vessel.

This step has no automated assertion — it is a human visual check before declaring 6b3 done.

---

## Notes for the implementer

- **Do not** add a heating plate, 3D reaction effects, drag-and-drop, or atmosphere — those are later phases (6b4–6b7). This task only swaps geometry.
- **`volume` / `material` options are intentionally deferred.** The spec sketched `makeGlassware(kind, { volume, material })`, but no current feature needs per-vessel volume scaling or material variants, so they are omitted (YAGNI). Add them when a concrete caller appears — the pure profile module is the natural place to thread `volume` through later.
- `container.kind` values are exactly `'test-tube' | 'beaker' | 'flask' | 'crucible' | 'petri'` — `'flask'` is the Erlenmeyer.
- The liquid is a single unit-cylinder scaled per update — never recreate its geometry on content change (cheap, no GC churn).
- Keep `CONTAINER_BASE_Y = 0.005` and the `polygonOffset` on the table material (existing z-fighting fix) untouched.
