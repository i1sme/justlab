# justlab — Roadmap re-plan & Visual Lab (SP1) design

**Date:** 2026-05-29
**Status:** approved (design phase)
**Scope:** decomposition of remaining project into sub-projects, sequencing, and a detailed design for the first sub-project (Visual Lab, "richer than reference" tier).

---

## 1. Context & current state

justlab is a browser-only virtual chemistry lab (SvelteKit + Svelte 5 Runes, Three.js, OpenChemLib, TypeScript strict). Phases 0–6b2 are complete:

- 2D periodic table + 3D Bohr atom; molecule viewer (2D/3D via OpenChemLib worker); glossary.
- Lab with **two presentation modes**: Formal (cards) and Visual (3D scene, early state).
- Reaction engine: exact DB match + **rule-based fallback** (neutralisation / displacement / precipitation).
- Quests (5), GHS pictograms, reaction replay, i18n ru/en, dark mode.
- **Event-sourced lab state** (`Action[]` + pure reducer).
- 130 unit + 11 e2e tests green.

**Findings that change the plan:**

- **Service worker (offline) is already implemented** (`src/service-worker.ts`, stale-while-revalidate + cache-first). README lists it as "planned" — that status is stale and should be corrected.
- `src/lib/storage/` (Dexie experiment journal) and `src/lib/physics/` are still empty stubs.
- Visual mode (6b1/6b2) renders placeholder cylinders + reagent bottles + click interaction + selection highlight, but **has no realistic glassware, no separate heating apparatus, and no 3D reaction effects** (effects today are CSS-only, formal mode).

## 2. Goal & key decisions

Captured from brainstorming dialogue:

1. **Primary goal:** finish the Visual Lab.
2. **Depth:** "richer than the reference" — realistic glassware, heating apparatus, 3D reaction effects, drag-and-drop + pouring animation, atmosphere & extra apparatus.
3. **Second priority (after Visual Lab):** content expansion (more reactions, engine rules, quests/substances).
4. **Build order within the Visual Lab:** foundation-up (objects → apparatus → effects → interaction → atmosphere) to minimise rework.
5. **Universal-primitive mechanism:** **data-driven parameterisation + shared contract + composition** — NOT class-inheritance-per-variation.

## 3. Architectural principle: universal primitives via data + contract

Content-heavy projects need reusable primitives. The right mechanism here:

- **Variation lives in data, not subclasses.** A green flame vs orange flame is `{ kind:'flame', color:'#39ff14' }` vs `{ kind:'flame', color:'#ff6b00' }` — a parameter, not a `FlameGreen extends Flame` subclass. This avoids fragile base classes and combinatorial hierarchy explosion when variation axes multiply (color × height × flicker × density).
- **The "universal base" is a shared _contract_ (interface), not a shared ancestor.** Effects implement `mount() / update(dt) / dispose()` and consume a `VisualEffect` descriptor.
- **Shared behaviour comes from composition,** e.g. a reusable `ParticleEmitter` (instanced + pooled) that flame/bubbles/smoke/precipitate each _use_, configured by data.
- The project already embodies this in its **data layer** (`Substance`, `Reaction`, `VisualEffect`). The gap is the **render layer** (3D), which this work extends in the same spirit.

**YAGNI guard:** universalise only where variation already exists or is imminent — effects (multiple colours), glassware (5 shapes). For apparatus (heating plate, future clamp/scale/burner) build concretely first; extract a base by the **rule of three** (2–3 concrete cases) to avoid abstracting the wrong axis.

**Perf & space alignment:** correct universality _saves_ bundle and FPS (one parameterised factory + shared instanced pool vs copy-paste per variation). Over-abstraction _costs_ both. So: small in-house helpers, **no heavy particle libraries** (CLAUDE.md "no deps > 50 KB"), instanced meshes + object pooling + LOD.

## 4. Project decomposition into sub-projects

Each sub-project later gets its own spec → plan → implementation cycle.

| #       | Sub-project         | Contents                                                                                  | Depends on                        |
| ------- | ------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- |
| **SP1** | Visual Lab (richer) | Glassware toolkit, heating apparatus, 3D effects, drag-drop + pouring, atmosphere         | current 6b1/6b2 base              |
| **SP2** | Content expansion   | +reactions, new engine rules (amphoterism, decomposition, indicators), +quests/substances | — (parallelisable)                |
| **SP3** | Save & share        | Dexie experiment journal, URL share (lz-string), undo/redo on event-sourcing              | event-sourcing (done)             |
| **SP4** | Time machine        | Reaction timeline scrubber (frame seek), pause/step                                       | SP1 (3D effects), playback (done) |
| **SP5** | Learning modules    | Structured lessons (theory + practice) atop quests; university content                    | SP2                               |
| **SP6** | v1.0 hardening      | a11y audit, i18n polish, PDF export, performance smoke (Lighthouse CI)                    | all above                         |

**Implementation order:** SP1 → SP2 → SP3 → SP4 → SP5 → SP6.

Notes:

- SP2 is technically independent of SP1 and may be interleaved in chunks between Visual Lab phases as a change of pace; default is after SP1.
- **AR/WebXR** is explicitly deferred beyond v1.0 — expensive, niche, not value-blocking.
- **Service worker / offline** is already done; remove from "planned" and fix README status.

## 5. SP1 — Visual Lab, detailed phases (foundation-up)

Each phase is an isolated scene/module, tested in isolation, ending with green verification (check / lint / unit / build / e2e). Existing **130 unit + 11 e2e stay green** at every phase.

### 6b3 — Glassware toolkit (parameterised factory)

A single `makeGlassware(kind, { volume, material })` produces Erlenmeyer / beaker / test-tube / crucible / petri via lathe geometry from a profile. **Shape is a data parameter, not a subclass.** Includes a "liquid" sub-mesh with adjustable fill level + colour. Replaces the placeholder cylinders from 6b1. This is the universal-primitive principle applied to glassware.

### 6b4 — Heating plate as a 3D apparatus

A separate device: control panel ("НАГРЕВ" on/off + intensity), digital temperature display. Placing a container on it sets the target temperature (drives existing `heat` action / temp logic). Built **concretely** — no premature `Apparatus` base (extract later by rule of three when clamp/burner arrive).

### 6b5 — Effect system foundation + 3D effects ⭐ (key infrastructure)

- Renderer-agnostic effect **contract**: `mount() / update(dt) / dispose()`, input is a `VisualEffect` descriptor.
- Shared `ParticleEmitter` (instanced particles + object pool) used by composition.
- Parameterised factories: `flame / bubbles / smoke / precipitate / glow`, each taking `{ color, intensity, ... }`.
- **Unification refactor:** the existing CSS renderer (`ReactionEffects.svelte`, formal mode) is brought to the same contract → one data source (`VisualEffect[]`), two renderers (CSS + 3D), no drift.
- Wired into `lab-scene` so a triggered reaction shows effects _inside_ the glassware. Adaptive particle counts by preset.

### 6b6 — Drag-and-drop + pouring

Pointer-drag a bottle onto glassware; pour animation (tilt + stream). On touch / low-end devices, **falls back to click** (current behaviour). No regression to the existing click path.

### 6b7 — Atmosphere + apparatus polish

Window, shelves, table texture, optional clamp/stand. Adaptive: simplified/hidden on `low`.

## 6. Cross-cutting concerns (all SP1 phases and beyond)

### Adaptive quality (single preset from `webgl-detect`, threaded into the scene)

| Aspect                      | low                | medium | high               |
| --------------------------- | ------------------ | ------ | ------------------ |
| Particles per effect        | ÷3, no shadow pool | base   | +sparks/highlights |
| Drag-and-drop               | → click            | drag   | drag               |
| Atmosphere (window/shelves) | hidden             | basic  | full               |
| `pixelRatio`                | 1.0                | 1.5    | 1.5                |
| Extra apparatus             | minimal            | base   | all                |

### Performance budget (CLAUDE.md rules, unchanged)

Instanced particles + object pooling, reuse geometry/material, LOD for anything > 50 on scene, lazy `import()` of three (already in place). Target: ≥ 30 FPS on integrated GPU; iPhone SE 2020 stays usable.

### Space economy

Parameterised factories over copy-paste; small in-house helpers; **no heavy particle libraries** (> 50 KB dep rule). Universal base serves space economy here, not against it.

### Testing — logic/render split

3D rendering can't be pixel-unit-tested, so logic is separated from rendering and the **logic** is tested:

- Pure functions: `VisualEffect → emitter config`, `kind → glassware profile params`, heating temperature logic.
- E2e smoke: visual mode mounts, canvas present, toggle works, WebGL-absent fallback.
- Regression: 130 unit + 11 e2e stay green per phase.

### Principles preserved

Reaction honesty (DB + rules, "never invent products") and event-sourcing are untouched. SP1 changes _rendering_, not _truth_.

## 7. Out of scope / deferred

- AR / WebXR (post-v1.0).
- Rapier physics (`src/lib/physics/` stays a stub until a concrete need).
- SP2–SP6 detailed designs (each gets its own spec when reached).

## 8. Next step

Proceed to the **writing-plans** skill to produce a detailed implementation plan for **SP1 phase 6b3 (Glassware toolkit)** as the first executable unit.
