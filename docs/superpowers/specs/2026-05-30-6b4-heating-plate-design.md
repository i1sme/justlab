# 6b4 — Heating plate (apparatus) design

**Date:** 2026-05-30
**Status:** approved (design phase)
**Scope:** One phase of SP1 (Visual Lab) — heating plate as a 3D apparatus, plus the pure intensity→temperature mapping it uses.

---

## 1. Context

PR #1 (6b3) just landed real glassware in the visual lab. Heating still works only via the existing `heat`/`cool` actions and the per-container `−`/`+` buttons (formal cards + the visual-mode selected-container overlay). The roadmap spec (`2026-05-29-justlab-roadmap-design.md` §5) describes 6b4 at high level — this doc pins the details.

The user has explicitly confirmed both the design choices below and the build order: **first the mapping (pure logic), then the plate (3D)**.

## 2. Goal & key decisions

1. **Add a 3D heating plate** to the visual lab — atmospheric counterpart to the existing `−`/`+` controls.
2. **No physical slot in v1**: the plate operates on the *currently selected* container — its display shows that container's temperature; control-panel buttons set its target T via the existing `heat`/`cool` actions. Drag-onto-plate and a real "on the plate" slot are deferred to 6b6 (drag-and-drop) or polish.
3. **Three-step intensity** mapping (matches the reference's panel):
   - **OFF**: 298 K (room) via `cool` action
   - **I**: 400 K (~127 °C) — gentle warming, dissolution
   - **II**: 700 K (~427 °C) — most school decompositions
   - **III**: 1100 K (~827 °C) — flame tests, combustion
4. **Coexistence with `−`/`+`**: existing per-container temperature controls stay — they're fine-tune. The plate provides standard thresholds + atmosphere.
5. **Built concretely** — no `Apparatus` base class yet (rule of three — extract later when clamp / burner / scale arrive).
6. The universal-primitive principle applies *internally*: intensity → target T is pure data + a pure function, fully unit-testable.

## 3. Architecture

### 3.1 Pure logic — `src/lib/render3d/heating-plate-logic.ts`

Three-free (no Three.js import), parallels the `glassware-profiles.ts` pattern. Exports:

- `type HeatingIntensity = 0 | 1 | 2 | 3` — 0 means OFF (room T), 1/2/3 are the three panel levels.
- `const INTENSITY_TARGETS: Readonly<Record<HeatingIntensity, number>>` = `{ 0: 298, 1: 400, 2: 700, 3: 1100 }` (Kelvin).
- `function targetTemperatureFor(intensity: HeatingIntensity): number` — returns the target Kelvin.
- `function isHeatingAction(intensity: HeatingIntensity, currentK: number): 'heat' | 'cool' | 'noop'` — given the current container T and the desired intensity, returns which action to dispatch (so the lab-scene code stays mechanical).
- `function glowOpacityFor(intensity: HeatingIntensity): number` — 0..1 visual feedback for the plate's red-hot surface (0 → 0, OFF gets no glow; I → 0.25; II → 0.55; III → 0.9). Used by the render layer; tested as a pure mapping.

### 3.2 3D apparatus — `src/lib/render3d/heating-plate.ts`

Factory `makeHeatingPlate({ reducedQuality }): { group: THREE.Group, setIntensity, setDisplayTemp, dispose }` returns a `THREE.Group` containing:

- Base box (dark gray plastic).
- Top "heating surface" plate (separate mesh) — color shifts from neutral to red, opacity from `glowOpacityFor(intensity)`.
- Front control panel: ON/OFF + I/II/III button planes (canvas textures) — each tagged `userData.kind = 'heating-button'` with `userData.intensity: HeatingIntensity` so the existing raycaster identifies them.
- Digital display: a small plane with a canvas texture showing current container temperature (Kelvin + °C, mirroring the formal-mode label format).

`userData.kind = 'heating-plate'` on the group itself. The handle's `setIntensity(level)` updates the glow + active-button highlight; `setDisplayTemp(K | null)` redraws the display canvas (null → "—").

### 3.3 Integration in `lab-scene.ts`

- Place one heating plate on the table to the right of the container row (`x = TABLE_W * 0.3, z = 0` roughly), with its `userData` registered for raycaster hits.
- Extend the existing pointer-click handler: when a `heating-button` is hit, look at `userData.intensity`, decide via `isHeatingAction(...)` whether to dispatch `heat` or `cool` against the *selected* container, and call `setIntensity` on the plate for visual feedback. If no container is selected, no-op (the existing hint string already covers it).
- After every `setContainers` call, push the selected container's current T into `setDisplayTemp` so the display stays live.
- Plate intensity state is scene-local (not part of lab-state — it's a UI affordance, not domain truth). Re-mounting the scene resets the plate to OFF; that's fine for v1.

### 3.4 Adaptive quality

- `low`: plate present but no glow animation (static neutral top); reduced canvas-texture resolution; no button-press visual feedback.
- `medium` / `high`: glow opacity tracks intensity; button highlight on click.

### 3.5 Testing

- **Unit (Vitest):** the pure module — `INTENSITY_TARGETS` numbers, `targetTemperatureFor` round-trips, `isHeatingAction` (heat when target > current + ε, cool when target < current − ε, noop near equality), `glowOpacityFor` monotonic non-decreasing with 0 at OFF.
- **E2E:** existing 11 stay green (visual mode is not exercised in e2e — it relies on formal-mode cards).
- **Manual visual smoke:** plate appears; clicking I/II/III on a selected container updates its temperature card in formal mode; OFF returns to 298 K; plate top reddens with intensity.

## 4. Cross-cutting

- **Perf:** plate ≈ 6–8 meshes (base, top, panel, ~4 buttons, display) + a few canvas textures. Well under budget.
- **Space:** pure module ≈ 30 LOC + ≈ 40 LOC tests; render module ≈ 150 LOC. Net contribution to bundle is small (no new deps).
- **i18n:** the panel label "НАГРЕВ" is iconic and language-neutral in the reference image. For v1 keep it as a fixed Russian word baked into the texture *because it's a label on a physical-looking device*, like a brand. Future polish could swap the texture per locale.
- **Principles preserved:** reaction honesty, event-sourcing, and the data+contract principle are unchanged — the plate is a new UI affordance that dispatches existing actions.

## 5. Out of scope (deferred)

- Physical slot ("placing" a container on the plate, with translation/snap animation).
- Drag-onto-plate interaction — natural fit for 6b6.
- Thermometer probe, continuous-slider intensity, multi-zone heating.
- `Apparatus` base class / general device system — rule of three; revisit when clamp / burner / scale arrive.
- Localising the panel label (texture stays Russian for v1).

## 6. Build order (user-requested)

Per the user: **first the mapping, then the plate.** That maps cleanly to the same TDD pattern as 6b3:

1. **Task 1:** pure `heating-plate-logic.ts` + Vitest tests.
2. **Task 2:** 3D `heating-plate.ts` factory + lab-scene integration (button raycasting, action dispatch, display updates).
3. **Task 3:** full regression verification.

## 7. Next step

Invoke `superpowers:writing-plans` to produce the detailed implementation plan. Branch will be `feature/6b4-heating-plate`, **stacked on `feature/6b3-glassware-toolkit`** (since PR #1 is still pending merge); once PR #1 merges, this branch's diff against `main` will be exactly 6b4.
