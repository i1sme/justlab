# Visual Lab v2 — Rebuild design

**Date:** 2026-05-30
**Status:** approved (architecture phase) — awaiting written-spec review
**Scope:** Replace the current Three.js-based visual lab (PR #1 + PR #2 render layers) with a 2.5D Canvas + SVG rendering layer that meets the project's actual quality bar. **Domain logic and pure modules survive unchanged.**

---

## 1. Why we rebuild

After shipping 6b3 (glassware) and 6b4 (heating plate) in Three.js with an OrbitControls camera, manual visual smoke surfaced a structural problem: the fixed-orbit camera with restricted azimuth + distant camera placement gives **bad ergonomics for focused work**:

- Heating-button hit targets (0.07 scene units at distance ≈4.4) are hard to click.
- The digital temperature display is too small to read without zoom.
- "Where am I working" is conveyed only by a small blue selection ring at the container's base — no shift of camera attention.
- All scene objects compete for visual prominence; there is no hierarchy of attention.
- The HTML selected-container overlay duplicates 3D controls and creates a parallel UI surface.

Each new apparatus / effect / interaction (drag-and-drop, ambient effects, additional devices) would make these issues worse, not better. The "single 3D scene + orbit camera" pattern is mismatched with the actual interaction depth the product needs.

The reference image the user sent earlier (Unity-quality 3D from `goskomplekt.ru`) works because it's a first-person VR-style camera, not orbit. That technology choice is unavailable to us within the project's perf budget (≤200 KB gzipped initial JS, target devices iPhone SE 2020 / 2018 Android tablet). Continuing to chase Unity-quality 3D in a browser produces "uncanny valley" — too elaborate to be just decoration, not gestural enough to be a real workstation.

**The honest reframe:** build a best-in-class 2.5D interface, not a compromised 3D one.

## 2. Key decisions (user-confirmed in dialogue)

1. **Render technology:** Canvas2D + SVG (no Three.js for the lab; no Pixi/Konva — they exceed the 50 KB dep cap). SVG for static / layered elements (glassware silhouettes, apparatus, panels, text). Canvas2D for animated particles (bubbles, steam, settling, diffusion). The existing Three.js scenes for the periodic-table atom and the molecule viewer **stay** — they're not affected.
2. **Layout — master-detail (shelf + workspace):**
   - Top ~25%: **shelf** of all containers as miniature silhouettes (click to select; "+ Add" at the end).
   - Bottom ~75%: **workspace** with the selected container large, apparatus next to it, reagent bottles in a side panel.
   - Always-visible "where I work" — no camera transitions needed for context.
3. **Visual identity — pastel UI chrome + scientifically-accurate substance colors.**
   - Pastel applies to: background, glassware outlines, apparatus chassis, text, ambient-effect tints, selection highlights.
   - **Substance colors stay scientifically correct** — CuSO₄ solution remains its known blue (`#1e88e5`-ish), KMnO₄ remains purple, etc. The CPK palette and the existing `Substance.phases[].color` values are preserved verbatim. Pastel chrome surrounds the accurate science, never replaces it.
4. **Ambient effects (extended MVP):** four state-derived effects beyond the existing reaction triggers:
   - **Boiling bubbles** — when an aqueous container's temperature exceeds 373 K.
   - **Steam** — visible vapor above the liquid surface when boiling, and lighter wisps in 350–373 K range.
   - **Dissolution diffusion** — short-lived color spread when a soluble salt is added to a water-containing vessel (e.g. CuSO₄ → water gives a colored cloud that homogenizes over ~1.5 s).
   - **Precipitate settling** — for any container whose contents include a `solid` phase substance born from a precipitation reaction, render slow downward drift / accumulation at the floor.
     These derive from container + environment state, not from one-shot reaction events. Captured in a pure function `deriveAmbientEffects(container, env): VisualEffect[]` and unit-tested.
5. **Interaction model — click in MVP, drag in R4.** Bottles in the side panel are clickable; a clicked bottle animates a brief "drop" of its content into the selected container. Drag-and-drop and pour animations are R4 polish.
6. **Formal mode stays.** The `labView` toggle remains; Formal (cards) serves university-mode users who want data over visualization. Only Visual is rebuilt.

## 3. Architecture

### 3.1 What survives the rebuild (untouched)

- **Domain types** — `Substance`, `Reaction`, `Experiment`, `Action`, `Container`, `VisualEffect`, `VisualEffectKind` (plus any extensions).
- **Domain data** — `substances.ts`, `inorganic-substances.ts`, `reactions/{category}.ts`, `chemistry-rules.ts`, `quests.ts`, `glossary.ts`, `elements.ts`, `molecules.ts`.
- **Domain logic** — `chemistry/reaction-engine.ts`, `chemistry/reaction-rules.ts`, `chemistry/electron-config.ts`, `chemistry/cpk-colors.ts`.
- **State** — `lab/lab-state.ts` (reducer), `lab/lab-store.svelte.ts`, `lab/reaction-playback.svelte.ts`, `lab/quest-store.svelte.ts`.
- **Settings, i18n, storage** — `settings/`, `i18n/`, `storage/`.
- **Pure modules from 6b3 / 6b4:**
  - `render3d/glassware-profiles.ts` — vessel profile math (still useful — defines silhouettes for SVG rendering).
  - `render3d/heating-plate-logic.ts` — intensity → target T mapping.
    These get **relocated** out of `render3d/` (since they're no longer 3D-specific) into `src/lib/render2d/` alongside the new render layer. The relocation happens in R1's same commits that replace the callers, so no broken imports.
- **Other render layers** — `render3d/atom-scene.ts`, `render3d/molecule-scene.ts` keep working (periodic table 3D atom, molecule viewer) — not touched.
- **Formal mode** — `ui/ContainerCard.svelte`, `ui/ContainerToolbar.svelte`, `ui/ReactionInfo.svelte`, `ui/Inventory.svelte`, `ui/QuestPanel.svelte`, etc. — untouched.

### 3.2 What is retired

- `src/lib/render3d/lab-scene.ts` (the Three.js scene — entire file). Deleted in R1's first commit.
- `src/lib/render3d/heating-plate.ts` (the Three.js apparatus). Deleted in R1.
- `src/lib/ui/VisualLabView.svelte` — fully rewritten on top of the new render layer. The shell file stays, contents replaced.
- The existing tests for those modules (none for the 3D render modules — they were intentionally untested per the policy of "logic in pure modules, render uncovered"). No tests are deleted.

The retirement is a **clean replace**, not "deprecate alongside". The product ships either the v1 visual or v2 — never both — and v2 will be strictly better once R1 lands.

### 3.3 What's new

- `src/lib/render2d/lab-canvas.ts` — the Canvas2D renderer for animated effects (particles for bubbles, steam, etc.).
- `src/lib/render2d/lab-svg.ts` (or embedded in Svelte) — SVG rendering helpers for vessels, apparatus, panels.
- `src/lib/render2d/ambient-effects.ts` — pure `deriveAmbientEffects(container, env): VisualEffect[]`. Unit-tested in `ambient-effects.test.ts`.
- `src/lib/render2d/layout.ts` (or similar) — pure layout helpers (shelf positions, workspace bounds, given a canvas size).
- New `src/lib/ui/VisualLabView.svelte` — owns the shell, manages the master-detail state, hosts the shelf and workspace components.
- New sub-components: `Shelf.svelte`, `Workspace.svelte`, `BottlePanel.svelte`, `ApparatusPanel.svelte` (the heating plate as 2.5D), `EffectsLayer.svelte` (or canvas-driven).

### 3.4 Render technology mix

- **SVG** for: glassware silhouettes (path generated from `glasswareProfile(kind)`), apparatus chassis (heating plate, future apparatus), control panels and buttons, digital temperature display (foreignObject or text), shelf miniatures, the "+ Add" button, hint strings.
- **Canvas2D** for: ambient-effect particles (bubbles, steam motes, settling dots, dissolution diffusion clouds), reaction-effect particles (existing `VisualEffect[]` kinds — bubbles, smoke, precipitate, flame, glow, color-shift).
- **HTML/Svelte** for: shelf scroll, side panels, hint text, selection state, formal-mode toggle (existing).
- **No new dependencies** — Canvas2D and SVG are platform-native.

### 3.5 Visual identity (starter pastel palette)

| Layer             | Color                         | Use                                |
| ----------------- | ----------------------------- | ---------------------------------- |
| Table surface     | `#f5efe6` (warm cream)        | Workspace background               |
| Wall / room       | `#e7eef3` (pale cool gray)    | Ambient backdrop                   |
| Glass outline     | `#a8b8c3` (soft slate)        | Vessel strokes                     |
| Glass fill        | `#dceaf2` 30% opacity         | Translucent vessel body            |
| Apparatus chassis | `#5b6b78` (muted slate)       | Heating plate base etc.            |
| Apparatus accent  | `#c4a484` (warm tan)          | Wood-of-bench warmth               |
| Hot ambient       | `#e8a87c` (peach)             | Glow / hot indicator — not red     |
| Cold ambient      | `#a8dadc` (mint)              | Frost / cooling                    |
| Text primary      | `#3a3f4a` (rich gray)         | Readable, not pure black           |
| Focus highlight   | `#bfd7ed` (powder blue)       | Selection state                    |
| Substance colors  | **existing `phases[].color`** | Scientifically accurate, untouched |

This palette is a starting point; concrete values get tuned in R1's manual smoke. The rule is: **pastel is the chrome, science is the content.**

## 4. Ambient effects model

### 4.1 Pure derivation

A new pure module `src/lib/render2d/ambient-effects.ts` exports:

```ts
export function deriveAmbientEffects(
	container: Container,
	env: Environment,
	/** Wallclock-ish ms since container last changed, for transient effects like dissolution. */
	ageMs: number
): VisualEffect[];
```

Returns zero or more `VisualEffect` descriptors derived from state. Rules (v1):

- **Boiling** — if container has water-containing aqueous content AND `temperature > 373` → `{ kind: 'bubbles', intensity: clamp((T-373)/100, 0.2, 1), color: 'rgba(255,255,255,0.7)' }`.
- **Steam** — if container has water AND `temperature > 350` → `{ kind: 'smoke', intensity: clamp((T-350)/50, 0.1, 0.9), color: '#dcdada' }`. Light wisps at 350–373, dense over 373.
- **Dissolution diffusion** — if the most recent content added is a solid salt AND container also has water/aqueous content AND `ageMs < 1500` → `{ kind: 'color-shift', intensity: 1 - ageMs/1500, color: solidColor, duration: 1.5 }`. Tracks per-substance color; fades after 1.5 s as the lab-state's color resolves to the homogenized solution.
- **Precipitate settling** — if container has any `solid`-phase content that originated from a precipitation reaction AND `ageMs < 4000` → `{ kind: 'precipitate', intensity: clamp(1 - ageMs/4000, 0.2, 1), color: solidColor }`. Tells the renderer to draw the precipitate slowly drifting down to the floor.

These rules are codified, NOT invented — boiling at 373 K is textbook; dissolution / settling are observed phenomena. **No effect appears for state that has no physical justification.**

### 4.2 Reaction effects (port from 6b3/6b4 / earlier)

Existing `Reaction.timeline` produces `VisualEffect[]` frames. These already flow through `reaction-playback.svelte.ts`. In v2 the renderer just consumes `VisualEffect[]` regardless of source. **One render pipeline, two source streams** (reaction trigger frames + ambient state-derived).

### 4.3 Effect rendering on Canvas2D

A small particle system with object pooling (per CLAUDE.md "instanced + pooled"). One canvas per workspace; one particle pool shared across effects. Effect-kind dispatcher maps `VisualEffectKind` → particle update rule. Performance budget: ≤200 active particles per scene at high quality, ≤80 at low.

## 5. Layout details (starter)

```
┌──────────────────────────────────────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    ┌──────┐  │
│ │  c1  │ │  c2  │ │  c3  │ │  c4  │    │  +   │  │ ← shelf
│ └──────┘ └──────┘ └──────┘ └──────┘    └──────┘  │
├──────────────────────────────────────────────────┤
│ ┌────────┐                                       │
│ │ Бутылки│                                       │
│ │ ─────  │      ╔══════════╗     ╔═══════════╗   │
│ │ • H₂O  │      ║          ║     ║  НАГРЕВ   ║   │
│ │ • HCl  │      ║ container║     ║  ─────    ║   │
│ │ • NaOH │      ║   large  ║     ║ [O][I][II]║   │
│ │ • CuSO₄│      ║          ║     ║   [III]   ║   │
│ │ ...    │      ╚══════════╝     ║  348 K    ║   │
│ └────────┘                       ╚═══════════╝   │
│                                                  │
│                                       Темп: ...  │
└──────────────────────────────────────────────────┘
```

- Shelf miniatures: ~80×100px per item, horizontally scrollable on small screens. Each shows kind silhouette + content level + small temperature dot.
- Workspace container: SVG silhouette ~280-400px tall depending on viewport; effects rendered in absolutely-positioned canvas layered over it.
- Bottle panel: vertical list, large icons + formula labels; click to add 1 unit to selected container.
- Apparatus panel: the heating plate as a 2.5D SVG drawing — clearly labeled НАГРЕВ, big buttons, big digital display reading from selected container temperature.

## 6. Phasing

The rebuild is delivered in **four sequential PRs**, each ships value:

- **R1 — 2.5D foundation.** New layout (shelf + workspace) + glassware rendering (SVG from `glasswareProfile`) + heating plate (SVG apparatus) + click-to-add bottles + temperature controls + retire of `lab-scene.ts` and `heating-plate.ts` (deleted). **No effects yet** (neither reaction nor ambient). Container management (add/remove via toolbar) preserved.
- **R2 — reaction effects ported.** Existing `Reaction.timeline` frames render in the new system. Color-shift, bubbles, smoke, precipitate, flame, glow effects translate to Canvas2D particle drawing. Temperature pulse moves to a small visual indicator on the workspace container.
- **R3 — ambient effects.** New `ambient-effects.ts` pure module + tests. Integration into the workspace renderer. Boiling + steam + dissolution + settling all driven by `deriveAmbientEffects` from container state.
- **R4 — polish.** Drag-and-drop with pour animation (touch fallback to click). Atmosphere (background details: window, shelf-of-bottles in the back, table texture). Accessibility audit (keyboard navigation, screen-reader hints).

Each phase keeps all existing tests green and adds new pure-module tests where relevant.

## 7. Cross-cutting

- **Performance budget — same as before:** ≤200 KB gz initial; ≤3s TTI; ≥30 FPS on iGPU. The 2.5D render is lighter than Three.js once we remove the 3D dependency from the lab path (Three.js still loaded for periodic table / molecule viewer when those pages are opened, but the visual lab page can skip it entirely).
- **Adaptive quality:** existing `webgl-detect.ts` may still be used for the molecule viewer; for the lab, an analogous heuristic decides particle count + canvas pixel ratio per preset. SVG part is resolution-independent.
- **Testing — same logic/render split:** pure modules (`ambient-effects.ts`, retained `glassware-profiles.ts`, retained `heating-plate-logic.ts`) get full Vitest coverage. The Canvas2D render layer is not pixel-tested; visual smoke remains a human step.
- **Principles preserved:** "не выдумываем продукты" extends naturally to "не выдумываем физические явления" — ambient effects only appear for textbook-justified state. Event-sourcing untouched. Data-driven + composition principle reinforced (we still parameterize, not subclass).
- **i18n:** the new layout uses existing `lab.*` keys plus a small new set for ambient-effect tooltips ("кипение", "пар", "оседание осадка") if we add them. Russian-and-English from day one.

## 8. Out of scope (deferred beyond R4)

- AR / WebXR (post-v1.0).
- Continuous-slider intensity for heating plate (the 3-step model is plenty for school chemistry).
- Multiple heating plates / multiple workspaces visible at once.
- Microscope / spectrometer / other apparatus (rule of three — add when the second of each appears).
- Physical-simulation accurate fluid dynamics (we approximate with discrete particle rules).
- Localising baked panel labels (the canvas-rendered «НАГРЕВ» on the heating plate stays Russian as a "brand-style" baked label until v1.0 polish).

## 9. Next step

After this written spec is approved by the user:

1. **Invoke `superpowers:writing-plans`** to produce the detailed implementation plan for **R1 (2.5D foundation)** as the first executable unit.
2. Subsequent PRs (R2, R3, R4) each get their own plan when their turn comes.
3. Each plan follows the same subagent-driven flow that 6b3 and 6b4 used: implement → spec-compliance review → code-quality review → finishing.

The rebuild branch (for R1) will be `feature/visual-lab-v2-r1-foundation`, branched from `main` (which now contains the merged PR #1 and PR #2 — both 6b3 glassware and 6b4 heating plate).

The retired 3D code lives in `main`'s history and is documented by PR #1 and PR #2 — we do **not** rewrite history.
