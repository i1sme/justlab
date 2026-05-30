# Heating Plate (6b4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3D heating plate to the visual lab — a separate device with on/off + I/II/III intensity buttons and a digital temperature display — that drives the selected container's target temperature through the existing `heat`/`cool` actions. Per the user's request: first build and test the pure intensity→temperature mapping, then the 3D apparatus that uses it.

**Architecture:** A pure module (`heating-plate-logic.ts`, no Three.js) owns the intensity table, target-temperature lookup, heat/cool/noop decision, and glow-opacity mapping — fully unit-tested. A second module (`heating-plate.ts`) builds the Three.js geometry (base box + glowing top plate + control panel with canvas-textured buttons and digital display) and returns a small handle (`setIntensity`, `setDisplayTemp`, `dispose`). The existing `lab-scene.ts` mounts one plate, registers its buttons with the existing raycaster, and forwards button clicks via a new `onHeatingButtonClick` callback. `VisualLabView.svelte` wires that callback to the selected container's `heat`/`cool` action and pushes the live temperature into the display.

**Tech Stack:** Svelte 5 (Runes), Three.js (`BoxGeometry`, `PlaneGeometry`, `CanvasTexture`, raycaster), TypeScript strict, Vitest.

---

## File structure

- **Create** `src/lib/render3d/heating-plate-logic.ts` — pure logic. Exports: `HeatingIntensity` type, `INTENSITY_TARGETS`, `targetTemperatureFor`, `isHeatingAction`, `glowOpacityFor`. No Three.js import. One responsibility: intensity / temperature math.
- **Create** `src/lib/render3d/heating-plate-logic.test.ts` — Vitest unit tests for the pure module.
- **Create** `src/lib/render3d/heating-plate.ts` — Three.js factory `makeHeatingPlate` returning `{ group, setIntensity, setDisplayTemp, dispose }`. Exports `KIND_HEATING_BUTTON`. Imports `heating-plate-logic` for glow opacity.
- **Modify** `src/lib/render3d/lab-scene.ts` — mount one plate, add it to clickable objects, extend the pointer-up raycaster to dispatch on heating buttons, expose `setHeatingPlateDisplay` on the scene handle, dispose the plate on teardown.
- **Modify** `src/lib/ui/VisualLabView.svelte` — wire `onHeatingButtonClick` to compute the right `heat()` delta against the selected container, and push the selected container's live temperature into the plate display via a `$effect`.

No reducer, store, or domain-type changes — the plate dispatches existing `heat`/`cool` actions via the existing `heat` wrapper.

---

## Task 1: Pure heating-plate-logic module (TDD)

**Files:**

- Create: `src/lib/render3d/heating-plate-logic.ts`
- Test: `src/lib/render3d/heating-plate-logic.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/render3d/heating-plate-logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	INTENSITY_TARGETS,
	targetTemperatureFor,
	isHeatingAction,
	glowOpacityFor,
	type HeatingIntensity
} from './heating-plate-logic';

const LEVELS: HeatingIntensity[] = [0, 1, 2, 3];

describe('INTENSITY_TARGETS', () => {
	it('OFF возвращает к комнатной температуре 298 K', () => {
		expect(INTENSITY_TARGETS[0]).toBe(298);
	});

	it('целевые температуры монотонно растут: OFF < I < II < III', () => {
		for (let i = 1; i <= 3; i++) {
			expect(INTENSITY_TARGETS[i as HeatingIntensity]).toBeGreaterThan(
				INTENSITY_TARGETS[(i - 1) as HeatingIntensity]
			);
		}
	});

	it('пороги покрывают школьные сценарии (мягкий нагрев / разложения / горение)', () => {
		expect(INTENSITY_TARGETS[1]).toBeGreaterThanOrEqual(350);
		expect(INTENSITY_TARGETS[2]).toBeGreaterThanOrEqual(500);
		expect(INTENSITY_TARGETS[3]).toBeGreaterThanOrEqual(1000);
	});
});

describe('targetTemperatureFor', () => {
	it('возвращает значение из таблицы для каждого уровня', () => {
		for (const lvl of LEVELS) {
			expect(targetTemperatureFor(lvl)).toBe(INTENSITY_TARGETS[lvl]);
		}
	});
});

describe('isHeatingAction', () => {
	it("heat когда целевая выше текущей сверх ε", () => {
		expect(isHeatingAction(3, 298)).toBe('heat');
		expect(isHeatingAction(1, 350)).toBe('heat');
	});

	it("cool когда целевая ниже текущей сверх ε", () => {
		expect(isHeatingAction(0, 800)).toBe('cool');
		expect(isHeatingAction(1, 1000)).toBe('cool');
	});

	it('noop когда уже на целевой температуре (в пределах ε)', () => {
		expect(isHeatingAction(2, 700)).toBe('noop');
		expect(isHeatingAction(2, 700.5)).toBe('noop');
		expect(isHeatingAction(0, 298)).toBe('noop');
	});
});

describe('glowOpacityFor', () => {
	it('OFF не светится (opacity 0)', () => {
		expect(glowOpacityFor(0)).toBe(0);
	});

	it('opacity монотонно растёт от OFF к III', () => {
		expect(glowOpacityFor(1)).toBeGreaterThan(glowOpacityFor(0));
		expect(glowOpacityFor(2)).toBeGreaterThan(glowOpacityFor(1));
		expect(glowOpacityFor(3)).toBeGreaterThan(glowOpacityFor(2));
	});

	it('opacity в диапазоне 0..1', () => {
		for (const lvl of LEVELS) {
			const o = glowOpacityFor(lvl);
			expect(o).toBeGreaterThanOrEqual(0);
			expect(o).toBeLessThanOrEqual(1);
		}
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:unit -- --run src/lib/render3d/heating-plate-logic.test.ts`
Expected: FAIL — `Failed to resolve import './heating-plate-logic'` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/render3d/heating-plate-logic.ts`:

```ts
// Чистая логика нагревательной плитки: маппинг уровня интенсивности в целевую температуру,
// решение о действии (heat/cool/noop) для существующего lab-state reducer, и opacity свечения
// верхней поверхности. Никакого Three.js здесь — модуль покрыт юнит-тестами и переиспользуется
// и render-слоем (heating-plate.ts), и интеграцией в VisualLabView.

/** Уровень панели плитки: 0 — выключено (комнатная T), 1/2/3 — три ступени нагрева. */
export type HeatingIntensity = 0 | 1 | 2 | 3;

/**
 * Целевые температуры (Кельвин) на каждом уровне.
 *   OFF = комнатная (298 K),
 *   I — мягкий нагрев / растворение,
 *   II — большинство школьных разложений,
 *   III — пламя / горение.
 */
export const INTENSITY_TARGETS: Readonly<Record<HeatingIntensity, number>> = {
	0: 298,
	1: 400,
	2: 700,
	3: 1100
};

/** Минимальный зазор (K) между текущей и целевой, при котором ещё имеет смысл диспетчить heat/cool. */
const ACTION_EPSILON_K = 1;

/** Целевая температура (K) для уровня интенсивности. */
export function targetTemperatureFor(intensity: HeatingIntensity): number {
	return INTENSITY_TARGETS[intensity];
}

/**
 * Какое действие нужно дать существующему `heat`/`cool` reducer, чтобы привести контейнер
 * к target T выбранного уровня. Помогает избежать пустых записей в журнале действий, когда
 * пользователь жмёт ту же кнопку повторно.
 */
export function isHeatingAction(
	intensity: HeatingIntensity,
	currentK: number
): 'heat' | 'cool' | 'noop' {
	const target = INTENSITY_TARGETS[intensity];
	if (target > currentK + ACTION_EPSILON_K) return 'heat';
	if (target < currentK - ACTION_EPSILON_K) return 'cool';
	return 'noop';
}

/** Непрозрачность красного свечения верхней поверхности плитки на текущем уровне (0..1). */
export function glowOpacityFor(intensity: HeatingIntensity): number {
	switch (intensity) {
		case 0:
			return 0;
		case 1:
			return 0.25;
		case 2:
			return 0.55;
		case 3:
			return 0.9;
	}
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:unit -- --run src/lib/render3d/heating-plate-logic.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/render3d/heating-plate-logic.ts src/lib/render3d/heating-plate-logic.test.ts
git commit -m "heating plate: pure intensity/temperature logic + tests"
```

---

## Task 2: 3D heating plate factory + lab-scene + VisualLabView integration

This task creates the geometry, mounts it in the scene, wires the raycaster to forward button clicks, and connects the click in `VisualLabView` to the selected container's `heat` action. It touches three files; complete all steps before committing so the intermediate states don't break the build.

**Files:**

- Create: `src/lib/render3d/heating-plate.ts`
- Modify: `src/lib/render3d/lab-scene.ts`
- Modify: `src/lib/ui/VisualLabView.svelte`

- [ ] **Step 1: Create the heating-plate factory**

Create `src/lib/render3d/heating-plate.ts`:

```ts
// 3D-устройство нагревательной плитки: база + верхняя пластина + свечение + панель с
// кнопками и цифровым дисплеем. Чистая логика (intensity → opacity) живёт в
// heating-plate-logic.ts; здесь — только Three.js геометрия и публичный handle.

import * as THREE from 'three';
import { glowOpacityFor, type HeatingIntensity } from './heating-plate-logic';

/** Tag для userData clickable target — лабораторная сцена матчит по нему raycast-хиты. */
export const KIND_HEATING_BUTTON = 'heating-button';
export const KIND_HEATING_PLATE = 'heating-plate';

export interface HeatingPlateHandle {
	group: THREE.Group;
	setIntensity(level: HeatingIntensity): void;
	setDisplayTemp(kelvin: number | null): void;
	dispose(): void;
}

export interface MakeHeatingPlateOptions {
	reducedQuality?: boolean;
}

const BASE_W = 0.5;
const BASE_D = 0.5;
const BASE_H = 0.08;
const TOP_W = 0.42;
const TOP_D = 0.42;
const TOP_H = 0.015;
const PANEL_W = 0.5;
const PANEL_H = 0.18;
const PANEL_D = 0.06;
const BUTTON_SIZE = 0.07;
const DISPLAY_W = 0.22;
const DISPLAY_H = 0.07;

const LABELS: { intensity: HeatingIntensity; text: string }[] = [
	{ intensity: 0, text: 'O' },
	{ intensity: 1, text: 'I' },
	{ intensity: 2, text: 'II' },
	{ intensity: 3, text: 'III' }
];

export function makeHeatingPlate(opts: MakeHeatingPlateOptions = {}): HeatingPlateHandle {
	const reducedQuality = opts.reducedQuality === true;
	const group = new THREE.Group();
	group.userData = { kind: KIND_HEATING_PLATE };

	// База — тёмно-серый плоский бокс.
	const baseGeo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
	const baseMat = new THREE.MeshStandardMaterial({
		color: 0x3a3f4a,
		roughness: 0.6,
		metalness: 0.2
	});
	const base = new THREE.Mesh(baseGeo, baseMat);
	base.position.y = BASE_H / 2;
	group.add(base);

	// Верхняя «горячая» пластина — отдельный mesh, чтобы можно было отдельно регулировать свечение.
	const topGeo = new THREE.BoxGeometry(TOP_W, TOP_H, TOP_D);
	const topMat = new THREE.MeshStandardMaterial({
		color: 0x1a1a1a,
		roughness: 0.4,
		metalness: 0.5
	});
	const top = new THREE.Mesh(topGeo, topMat);
	top.position.y = BASE_H + TOP_H / 2;
	top.name = 'plateTop';
	group.add(top);

	// Свечение — прозрачный плоский квад над пластиной, opacity управляется setIntensity.
	const glowGeo = new THREE.PlaneGeometry(TOP_W * 0.95, TOP_D * 0.95);
	const glowMat = new THREE.MeshBasicMaterial({
		color: 0xff4a1a,
		transparent: true,
		opacity: 0,
		side: THREE.DoubleSide,
		depthWrite: false
	});
	const glow = new THREE.Mesh(glowGeo, glowMat);
	glow.rotation.x = -Math.PI / 2;
	glow.position.y = BASE_H + TOP_H + 0.001;
	glow.name = 'plateGlow';
	group.add(glow);

	// Передняя панель управления.
	const panelGeo = new THREE.BoxGeometry(PANEL_W, PANEL_H, PANEL_D);
	const panelMat = new THREE.MeshStandardMaterial({
		color: 0x2a2e36,
		roughness: 0.5,
		metalness: 0.3
	});
	const panel = new THREE.Mesh(panelGeo, panelMat);
	panel.position.set(0, PANEL_H / 2, BASE_D / 2 + PANEL_D / 2);
	group.add(panel);

	// Дисплей — плоскость с canvas-текстурой текущей температуры.
	const displayTex = makeDisplayTexture(null, reducedQuality);
	const displayMat = new THREE.MeshBasicMaterial({ map: displayTex, transparent: true });
	const displayGeo = new THREE.PlaneGeometry(DISPLAY_W, DISPLAY_H);
	const display = new THREE.Mesh(displayGeo, displayMat);
	display.position.set(0, PANEL_H * 0.7, BASE_D / 2 + PANEL_D + 0.001);
	display.name = 'plateDisplay';
	group.add(display);

	// Лейбл "НАГРЕВ" — атмосферный, баковый в текстуру (см. spec §4 i18n note).
	const heatLabelTex = makeHeatLabelTexture(reducedQuality);
	const heatLabelMat = new THREE.MeshBasicMaterial({ map: heatLabelTex, transparent: true });
	const heatLabelGeo = new THREE.PlaneGeometry(DISPLAY_W, DISPLAY_H * 0.45);
	const heatLabel = new THREE.Mesh(heatLabelGeo, heatLabelMat);
	heatLabel.position.set(0, PANEL_H * 0.49, BASE_D / 2 + PANEL_D + 0.001);
	group.add(heatLabel);

	// Кнопки OFF / I / II / III — выровнены по нижней половине панели.
	const buttons: THREE.Mesh[] = [];
	const totalBtnWidth = BUTTON_SIZE * LABELS.length;
	const gap = (PANEL_W - totalBtnWidth) / (LABELS.length + 1);
	for (let i = 0; i < LABELS.length; i++) {
		const tex = makeButtonTexture(LABELS[i].text, false, reducedQuality);
		const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
		const geo = new THREE.PlaneGeometry(BUTTON_SIZE, BUTTON_SIZE);
		const btn = new THREE.Mesh(geo, mat);
		const x = -PANEL_W / 2 + gap * (i + 1) + BUTTON_SIZE * (i + 0.5);
		btn.position.set(x, PANEL_H * 0.27, BASE_D / 2 + PANEL_D + 0.001);
		btn.userData = { kind: KIND_HEATING_BUTTON, intensity: LABELS[i].intensity };
		btn.name = `plateButton-${LABELS[i].intensity}`;
		group.add(btn);
		buttons.push(btn);
	}

	function setIntensity(level: HeatingIntensity): void {
		glowMat.opacity = glowOpacityFor(level);
		glowMat.needsUpdate = true;
		for (let i = 0; i < buttons.length; i++) {
			const isActive = LABELS[i].intensity === level;
			const oldMat = buttons[i].material as THREE.MeshBasicMaterial;
			oldMat.map?.dispose();
			oldMat.map = makeButtonTexture(LABELS[i].text, isActive, reducedQuality);
			oldMat.needsUpdate = true;
		}
	}

	function setDisplayTemp(kelvin: number | null): void {
		const mat = display.material as THREE.MeshBasicMaterial;
		mat.map?.dispose();
		mat.map = makeDisplayTexture(kelvin, reducedQuality);
		mat.needsUpdate = true;
	}

	function dispose(): void {
		group.traverse((o) => {
			const m = o as THREE.Mesh;
			if (m.geometry) m.geometry.dispose();
			const mat = m.material;
			if (Array.isArray(mat)) {
				for (const x of mat) {
					const xs = x as THREE.Material & { map?: THREE.Texture | null };
					xs.map?.dispose();
					xs.dispose();
				}
			} else if (mat) {
				const single = mat as THREE.Material & { map?: THREE.Texture | null };
				single.map?.dispose();
				single.dispose();
			}
		});
	}

	return { group, setIntensity, setDisplayTemp, dispose };
}

function makeDisplayTexture(kelvin: number | null, reducedQuality: boolean): THREE.CanvasTexture {
	const w = reducedQuality ? 256 : 512;
	const h = reducedQuality ? 96 : 192;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.fillStyle = '#0a0a0a';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#ff5a1a';
		ctx.font = `bold ${Math.floor(h * 0.5)}px ui-monospace, monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		const text = kelvin === null ? '—' : `${Math.round(kelvin)} K`;
		ctx.fillText(text, w / 2, h / 2);
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
}

function makeHeatLabelTexture(reducedQuality: boolean): THREE.CanvasTexture {
	const w = reducedQuality ? 256 : 384;
	const h = reducedQuality ? 64 : 96;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.fillStyle = '#2a2e36';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#ff5a1a';
		ctx.font = `bold ${Math.floor(h * 0.7)}px ui-sans-serif, system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('НАГРЕВ', w / 2, h / 2);
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
}

function makeButtonTexture(
	label: string,
	active: boolean,
	reducedQuality: boolean
): THREE.CanvasTexture {
	const size = reducedQuality ? 128 : 192;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.fillStyle = active ? '#ff5a1a' : '#1a1d23';
		ctx.fillRect(0, 0, size, size);
		ctx.strokeStyle = active ? '#ffe18a' : '#3a3f4a';
		ctx.lineWidth = 6;
		ctx.strokeRect(3, 3, size - 6, size - 6);
		ctx.fillStyle = active ? '#0a0a0a' : '#ffe5cc';
		ctx.font = `bold ${Math.floor(size * 0.5)}px ui-sans-serif, system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(label, size / 2, size / 2 + 4);
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
}
```

- [ ] **Step 2: Verify the new file type-checks**

Run: `npm run check`
Expected: `0 ERRORS 0 WARNINGS`. If it fails on the new file, fix before proceeding.

- [ ] **Step 3: Integrate the plate into `lab-scene.ts`**

In `src/lib/render3d/lab-scene.ts`, find the existing imports block:

```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Container, ContainerKind } from '../../data/types';
import { findSubstance } from '../../data/substances';
import { glasswareProfile, liquidFillHeight, liquidRadius } from './glassware-profiles';
```

Replace with (adds two imports — the factory and the kind constant + intensity type):

```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Container, ContainerKind } from '../../data/types';
import { findSubstance } from '../../data/substances';
import { glasswareProfile, liquidFillHeight, liquidRadius } from './glassware-profiles';
import {
	KIND_HEATING_BUTTON,
	makeHeatingPlate,
	type HeatingPlateHandle
} from './heating-plate';
import type { HeatingIntensity } from './heating-plate-logic';
```

Then find the existing `MountLabSceneOptions` interface. It currently has `onContainerClick` and `onBottleClick`. Find this exact block:

```ts
	/** Клик по контейнеру (raycaster). */
	onContainerClick?: (containerId: string) => void;
	/** Клик по бутылке реактива. */
	onBottleClick?: (substanceId: string) => void;
}
```

Replace with (adds the heating-button callback):

```ts
	/** Клик по контейнеру (raycaster). */
	onContainerClick?: (containerId: string) => void;
	/** Клик по бутылке реактива. */
	onBottleClick?: (substanceId: string) => void;
	/** Клик по кнопке нагревательной плитки. Сцена сама обновляет визуал; решение о heat/cool — у вызывающего. */
	onHeatingButtonClick?: (intensity: HeatingIntensity) => void;
}
```

Then find the existing `LabSceneHandle` interface:

```ts
export interface LabSceneHandle {
	setMotion(enabled: boolean): void;
	setContainers(containers: readonly Container[]): void;
	setSelectedContainer(id: string | null): void;
	setBottles(bottles: readonly BottleSpec[]): void;
	dispose(): void;
}
```

Replace with:

```ts
export interface LabSceneHandle {
	setMotion(enabled: boolean): void;
	setContainers(containers: readonly Container[]): void;
	setSelectedContainer(id: string | null): void;
	setBottles(bottles: readonly BottleSpec[]): void;
	setHeatingPlateDisplay(kelvin: number | null): void;
	dispose(): void;
}
```

Then find the existing block where the container/bottle maps are initialized and the initial rebuilds are called:

```ts
	// Map<id, Object3D> — переиспользуем mesh-и при обновлениях, чтобы не пересоздавать.
	const containerMeshes = new Map<string, THREE.Object3D>();
	const bottleMeshes = new Map<string, THREE.Object3D>();
	const clickableObjects: THREE.Object3D[] = [];

	rebuildContainers(opts.containers);
	rebuildBottles(opts.bottles);
	applySelectionHighlight();
```

Replace with (adds the heating plate mount and registers it as clickable):

```ts
	// Map<id, Object3D> — переиспользуем mesh-и при обновлениях, чтобы не пересоздавать.
	const containerMeshes = new Map<string, THREE.Object3D>();
	const bottleMeshes = new Map<string, THREE.Object3D>();
	const clickableObjects: THREE.Object3D[] = [];

	// Нагревательная плитка — одна на сцену, справа от ряда контейнеров.
	const heatingPlate: HeatingPlateHandle = makeHeatingPlate({ reducedQuality });
	heatingPlate.group.position.set(1.3, 0.005, 0.3);
	scene.add(heatingPlate.group);
	clickableObjects.push(heatingPlate.group);

	rebuildContainers(opts.containers);
	rebuildBottles(opts.bottles);
	applySelectionHighlight();
```

Then find the existing pointer-up raycaster click dispatch inside `onPointerUp`:

```ts
		if (target.userData.kind === KIND_BOTTLE && target.userData.substanceId) {
			opts.onBottleClick?.(target.userData.substanceId as string);
		} else if (target.userData.kind === KIND_CONTAINER && target.userData.containerId) {
			opts.onContainerClick?.(target.userData.containerId as string);
		}
	}
```

Replace with (adds the heating-button branch — visual feedback is applied immediately, then the callback fires so the consumer can dispatch the action):

```ts
		if (target.userData.kind === KIND_BOTTLE && target.userData.substanceId) {
			opts.onBottleClick?.(target.userData.substanceId as string);
		} else if (target.userData.kind === KIND_CONTAINER && target.userData.containerId) {
			opts.onContainerClick?.(target.userData.containerId as string);
		} else if (
			target.userData.kind === KIND_HEATING_BUTTON &&
			typeof target.userData.intensity === 'number'
		) {
			const intensity = target.userData.intensity as HeatingIntensity;
			heatingPlate.setIntensity(intensity);
			if (!motionOn) renderer.render(scene, camera);
			opts.onHeatingButtonClick?.(intensity);
		}
	}
```

Then find the existing `LabSceneHandle` return block (the big object literal in `return { ... }` at the end of `mountLabScene`). Find this exact block inside it:

```ts
		setBottles(list) {
			rebuildBottles(list);
			if (!motionOn) renderer.render(scene, camera);
		},
		setSelectedContainer(id) {
			selectedContainerId = id;
			applySelectionHighlight();
		},
```

Replace with (inserts the new method between `setBottles` and `setSelectedContainer`):

```ts
		setBottles(list) {
			rebuildBottles(list);
			if (!motionOn) renderer.render(scene, camera);
		},
		setSelectedContainer(id) {
			selectedContainerId = id;
			applySelectionHighlight();
		},
		setHeatingPlateDisplay(kelvin) {
			heatingPlate.setDisplayTemp(kelvin);
			if (!motionOn) renderer.render(scene, camera);
		},
```

Then find the existing `dispose()` body inside the same return object:

```ts
		dispose() {
			stopLoop();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointerup', onPointerUp);
			controls.removeEventListener('change', onControlsChange);
			ro.disconnect();
			controls.dispose();
			for (const mesh of containerMeshes.values()) disposeObject(mesh);
			containerMeshes.clear();
			for (const mesh of bottleMeshes.values()) disposeObject(mesh);
			bottleMeshes.clear();
			disposeObject(tableGroup);
			disposeObject(backWall);
			renderer.dispose();
		}
```

Replace with (adds the plate disposal):

```ts
		dispose() {
			stopLoop();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointerup', onPointerUp);
			controls.removeEventListener('change', onControlsChange);
			ro.disconnect();
			controls.dispose();
			for (const mesh of containerMeshes.values()) disposeObject(mesh);
			containerMeshes.clear();
			for (const mesh of bottleMeshes.values()) disposeObject(mesh);
			bottleMeshes.clear();
			heatingPlate.dispose();
			disposeObject(tableGroup);
			disposeObject(backWall);
			renderer.dispose();
		}
```

- [ ] **Step 4: Wire the click and the display in `VisualLabView.svelte`**

In `src/lib/ui/VisualLabView.svelte`, find the existing lab-store import block:

```ts
	import {
		addSubstance,
		emptyContainer,
		getExperiment,
		getSelectedContainerId,
		heat,
		removeContainer,
		setSelectedContainerId
	} from '$lib/lab';
	import { t } from '$lib/i18n';
```

Replace with (adds the two pure helpers from `heating-plate-logic`):

```ts
	import {
		addSubstance,
		emptyContainer,
		getExperiment,
		getSelectedContainerId,
		heat,
		removeContainer,
		setSelectedContainerId
	} from '$lib/lab';
	import {
		isHeatingAction,
		targetTemperatureFor,
		type HeatingIntensity
	} from '$lib/render3d/heating-plate-logic';
	import { t } from '$lib/i18n';
```

Then find the existing `mountLabScene` call inside the mounting `$effect`:

```ts
				local = mod.mountLabScene(target, {
					containers: initialContainers,
					bottles: VISIBLE_BOTTLES,
					selectedContainerId: initialSelected,
					reducedQuality: quality === 'low',
					motionEnabled: getMotionEnabled(),
					onContainerClick: (id) => {
						setSelectedContainerId(getSelectedContainerId() === id ? null : id);
					},
					onBottleClick: (substanceId) => {
						const target = getSelectedContainerId();
						if (!target) return; // молча игнорируем — UX-подсказка через рамку под выбранную колбу
						addSubstance(target, substanceId, 1);
					}
				});
```

Replace with (adds `onHeatingButtonClick` wiring):

```ts
				local = mod.mountLabScene(target, {
					containers: initialContainers,
					bottles: VISIBLE_BOTTLES,
					selectedContainerId: initialSelected,
					reducedQuality: quality === 'low',
					motionEnabled: getMotionEnabled(),
					onContainerClick: (id) => {
						setSelectedContainerId(getSelectedContainerId() === id ? null : id);
					},
					onBottleClick: (substanceId) => {
						const target = getSelectedContainerId();
						if (!target) return; // молча игнорируем — UX-подсказка через рамку под выбранную колбу
						addSubstance(target, substanceId, 1);
					},
					onHeatingButtonClick: (intensity: HeatingIntensity) => {
						const cid = getSelectedContainerId();
						if (!cid) return;
						const exp = getExperiment();
						const c = exp.containers.find((x) => x.id === cid);
						if (!c) return;
						const action = isHeatingAction(intensity, c.temperature);
						if (action === 'noop') return;
						const delta = targetTemperatureFor(intensity) - c.temperature;
						heat(cid, delta);
					}
				});
```

Then find the existing `$effect` block at the bottom of the `<script>` that reacts to motion changes:

```ts
	$effect(() => {
		if (sceneHandle) sceneHandle.setMotion(getMotionEnabled());
	});
</script>
```

Replace with (adds a new `$effect` that mirrors the selected container's temperature into the plate display):

```ts
	$effect(() => {
		if (sceneHandle) sceneHandle.setMotion(getMotionEnabled());
	});

	$effect(() => {
		if (!sceneHandle) return;
		const c = selectedContainer;
		sceneHandle.setHeatingPlateDisplay(c ? c.temperature : null);
	});
</script>
```

- [ ] **Step 5: Format, type-check, run unit tests, and build**

Run: `npm run format && npm run check && npm run test:unit -- --run && npm run build`
Expected:
- format: writes/leaves files clean
- check: `0 ERRORS 0 WARNINGS`
- unit: all existing tests plus the new heating-plate-logic ones pass
- build: `✓ built` / `✔ done`

If `check` complains about an unused export (e.g., `KIND_HEATING_PLATE`), keep it — it's intentional public surface for later phases. If the import of `HeatingIntensity` in `lab-scene.ts` is reported as type-only and the build is configured to require `import type`, change to `import type { HeatingIntensity } from './heating-plate-logic';` (the plan already writes it as `import type` — confirm).

- [ ] **Step 6: Commit**

```bash
git add src/lib/render3d/heating-plate.ts src/lib/render3d/lab-scene.ts src/lib/ui/VisualLabView.svelte
git commit -m "visual lab: 3D heating plate with intensity buttons + temperature display"
```

---

## Task 3: Full regression verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full gate**

Run: `npm run check && npm run lint && npm run test:unit -- --run && npm run build && npm run test:e2e`
Expected:
- check: 0 errors, 0 warnings
- lint: prettier clean + eslint clean
- unit: 154 tests pass (144 from 6b3 + 10 new heating-plate-logic tests across 4 describe blocks)
- build: `✔ done`
- e2e: 11 passed (e2e doesn't exercise the visual mode — it should be unaffected)

- [ ] **Step 2: Manual visual smoke (human-only)**

Run `npm run dev`, open `/lab`, switch to the Visual toggle (🧪). Confirm:

- A heating plate appears to the right of the container row, with a dark base, a near-black top plate, and a front panel showing a `НАГРЕВ` label, a small dark display, and four buttons labelled `O`, `I`, `II`, `III`.
- Select a container (click one). The display shows that container's temperature (e.g. `298 K`).
- Click `II` on the plate: the button highlights orange, the plate top glows mid-red, and the selected container's temperature card in formal mode (toggle 📊 to check) shows `700 K · 427 °C`.
- Click `O`: button highlights orange, glow disappears, temperature returns to `298 K`.
- Select a different container — the display now shows that container's temperature.
- Click a heating button with no container selected — nothing happens (no error in console).

This step has no automated assertion — it is a human visual check before declaring 6b4 done.

---

## Notes for the implementer

- Do not add a physical "place on plate" slot, drag-onto-plate, a continuous-slider intensity, a thermometer probe, or a localised panel label — those are out of scope for 6b4 (see the spec, §5).
- The plate uses scene-local state for visual feedback only. Switching containers does NOT auto-reset the plate intensity, but the display always reflects the currently selected container's live temperature.
- The plate sits at `(x = 1.3, y = 0.005, z = 0.3)`. If the manual visual smoke shows it overlapping a container or off-camera, tune by ±0.2 — the value is not load-bearing.
- The existing `−`/`+` buttons on container cards and in the visual-mode overlay stay untouched and continue to work for fine-tune.
