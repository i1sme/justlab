# Visual Lab v2 — R2: Reaction Effects design

**Date:** 2026-05-31
**Status:** draft — awaiting user review
**Scope:** Second phase of the Visual Lab v2 rebuild. Port reaction visual effects into the 2.5D renderer via a Canvas2D particle layer over the workspace vessel, and move the temperature pulse to a workspace indicator. Builds on R1 (merged: PR #3 + #4). Reaction effects only — ambient effects (boiling/steam/dissolution/settling) remain R3.

Parent spec: `2026-05-30-visual-lab-v2-design.md` (§6 R2 = "reaction effects ported"; §3.4 commits to Canvas2D for particles; §4.3 describes a pooled particle system).

---

## 1. Context (what exists after R1)

- The lab store already drives reaction playback: `reaction-playback.svelte.ts` exposes `getPlayback(containerId): ActivePlayback | undefined`, where `ActivePlayback = { reactionId, startedAt, duration, effects: readonly VisualEffect[], tempPulse: 'rise'|'drop'|null }`. When a reaction triggers, `startPlayback` schedules frame transitions; `effects` is the current frame's `VisualEffect[]`. **This is the single source of effect data** — formal mode already consumes it.
- Formal mode renders those effects with a **CSS/DOM** component, `src/lib/ui/ReactionEffects.svelte` (tint, glow, flame, bubbles, smoke, precipitate), and shows the temp pulse as a ring on the container's temperature display. **Formal mode is untouched by R2.**
- `VisualEffect = { kind: VisualEffectKind, intensity: number (0..1), color?: string, duration?: number }`. `VisualEffectKind = 'bubbles' | 'smoke' | 'precipitate' | 'flame' | 'glow' | 'color-shift' | 'temperature-rise' | 'temperature-drop'`.
- Playback is already **motion-gated**: if `motionEnabled` is false, `startPlayback` no-ops (reaction still applies in the reducer, just no animation). `prefers-reduced-motion` is honored app-wide.
- The 2.5D `Workspace.svelte` renders the selected container's `Glassware` (SVG) plus controls + heating panel. There is currently **no effect rendering** in the 2.5D view.

## 2. Goal & key decisions

1. **Render reaction effects in the 2.5D visual lab** by consuming the existing `getPlayback(selectedContainerId)` data — no new effect data path, no reducer/playback changes.
2. **Canvas2D particle layer** (not CSS) — per the parent spec's commitment. Rationale: R3 ambient effects (boiling/steam/dissolution/settling) are inherently particle-heavy; building the pooled particle foundation now means R2 + R3 share one renderer. The 2.5D view owns a Canvas renderer; **formal mode keeps its CSS renderer**. Two renderers total, each owning its view, **sharing the `VisualEffect[]` contract** — this is the roadmap's "one contract, two renderers, no drift" intent (avoids a throwaway and avoids three renderers).
3. **Workspace vessel only.** Effects render over the large selected vessel. Shelf miniatures get NO particles (too small; "наглядность без преувеличения") — at most a subtle existing temp dot. 
4. **«Без преувеличения» calibration.** Effects are clear but restrained: modest particle counts, soft opacities, no screen-filling theatrics. Tuned during manual smoke.
5. **Temperature pulse → workspace indicator.** When `tempPulse` is 'rise'/'drop', show a small warm/cool indicator on the workspace temperature area (mirrors formal mode's ring), not a particle.
6. **Pure/render split preserved.** Particle spawn config (from a `VisualEffect`) and per-step physics live in a pure, unit-tested module; the Canvas draw loop is the thin impure shell.
7. **Adaptive quality + motion.** Particle caps scale by preset (`webgl-detect` quality or an analogous heuristic). If motion is off, no Canvas loop runs (playback already empty). `prefers-reduced-motion` → static/no particles.

## 3. Architecture

### 3.1 Pure particle module — `src/lib/render2d/effect-particles.ts`

Three-free, no Canvas, no DOM. Unit-tested. Exports (names indicative, finalized in plan):

- `interface Particle { x, y, vx, vy, life, maxLife, size, color }` (positions in a normalized 0..1 vessel space or px — decided in plan; px over the canvas is simplest).
- `interface EmitterConfig { kind, ratePerSec, speed, spread, sizeRange, color, gravity, ... }`.
- `function emitterConfigFor(effect: VisualEffect): EmitterConfig | null` — maps a `VisualEffect` to spawn parameters (e.g. `bubbles` → upward velocity, spawn near liquid surface; `precipitate` → downward, spawn near top; `smoke` → upward + grow + fade; returns null for non-particle kinds like `color-shift`/`glow` which are drawn as field effects, and `temperature-*` which are indicators).
- `function spawnParticles(config, dtMs, bounds): Particle[]` — pure spawner (deterministic given a seeded RNG passed in, to keep it testable — RNG injected, not `Math.random` directly).
- `function stepParticles(particles, dtMs, bounds): Particle[]` — pure physics step (integrate position, apply gravity, decay life, cull dead). Returns the surviving set.
- Field-effect helpers for the non-particle kinds: `tintFor(effect)`, `glowFor(effect)` returning draw parameters (color + alpha) — pure.

Note on determinism/testability: `Math.random` is fine in the render shell, but the pure module takes an injected `rng: () => number` so tests are deterministic (matches the project's "no bare Math.random in tested code" discipline).

### 3.2 Canvas renderer component — `src/lib/ui/lab2d/EffectsCanvas.svelte`

- Props: `{ container: Container; bounds: { widthPx, heightPx, liquidTopPx, floorPx } }` (the vessel geometry, derived from the same `glasswareSilhouette` / `liquidFillHeight` the `Glassware` already uses — so particles spawn at the right surface/floor).
- A `<canvas>` absolutely positioned over the vessel (same box).
- A single `requestAnimationFrame` loop (only while there's an active playback AND motion on). Each frame: read `getPlayback(container.id)?.effects`, update emitter configs, spawn + step particles via the pure module, draw to canvas. Field effects (color-shift tint, glow halo) drawn as composited fills, optionally clipped to the vessel silhouette path.
- Object pooling: reuse a fixed-capacity particle array; cap by adaptive-quality preset.
- Cleanup: cancel rAF + clear on dispose; stop the loop when no active playback (don't spin rAF idle).
- Respects `prefers-reduced-motion` (skip particles; tint/glow may still show as static) and `motionEnabled`.

### 3.3 Integration — `Workspace.svelte`

- Wrap the `.ws-vessel` in a `position: relative` container; overlay `EffectsCanvas` on it (absolute, `pointer-events: none`).
- Pass the vessel `bounds` (computed once from `glasswareSilhouette(kind, pxPerUnit)` + `liquidFillHeight`) so the canvas matches the rendered `Glassware` exactly. Avoid duplicating geometry: expose the needed numbers from `Glassware` (a small `bind:` or a shared derivation helper) OR recompute from the same pure functions with the same `sizePx`. The plan picks the cleanest seam (likely: `Workspace` computes `sizePx`-based geometry once and passes it to BOTH `Glassware` and `EffectsCanvas`).
- Temperature-pulse indicator: when `getPlayback(container.id)?.tempPulse` is set, show a small warm (rise) / cool (drop) badge near the heating panel / temperature text. CSS, motion-gated.

### 3.4 What R2 does NOT do
- No ambient effects (boiling/steam/dissolution/settling) — those derive from container *state* (R3's `deriveAmbientEffects`). R2 only renders reaction-*event* effects from `Reaction.timeline`.
- No drag-and-drop, no atmosphere (R4).
- No change to formal-mode `ReactionEffects.svelte`, to `reaction-playback`, or to the reducer.
- No effects on shelf miniatures.

## 4. Effect → visual mapping (the 6 reaction kinds)

| VisualEffectKind | 2.5D rendering | Spawn anchor |
|---|---|---|
| `bubbles` | rising round particles, count ∝ intensity | just above liquid floor, rise to surface |
| `smoke` | soft growing+fading puffs | at/above the vessel mouth |
| `precipitate` | small dots drifting down, settling | spawn near surface, fall to floor |
| `flame` | flickering warm field + sparse upward motes | at the vessel mouth |
| `glow` | soft radial halo around the vessel | vessel center (field, not particles) |
| `color-shift` | tint the liquid toward `effect.color` | liquid region (field, clipped to silhouette) |
| `temperature-rise`/`-drop` | NOT a canvas effect → workspace warm/cool indicator | temperature area |

All colors come from the `VisualEffect.color` provided by the reaction timeline (curated, accurate) — the pastel palette does not override effect colors, same principle as substance colors.

## 5. Phasing (tasks — detail in the plan)

1. **Pure particle module** (`effect-particles.ts`) + Vitest tests (emitter config per kind, spawn count ∝ intensity, physics step culls dead, field-effect params). TDD.
2. **`EffectsCanvas.svelte`** — Canvas2D loop consuming the pure module + `getPlayback`, pooled, motion/quality-gated.
3. **Workspace integration** — overlay the canvas on `.ws-vessel` with correct bounds; temp-pulse indicator.
4. **Full regression + manual smoke** (trigger HCl+NaOH etc. in the visual lab, watch effects; confirm formal mode unchanged; confirm no rAF when idle/motion-off).

## 6. Cross-cutting
- **Perf:** one canvas, one pooled particle array (cap ~120 high / ~40 low), rAF only during active playback. Negligible vs budget; no new deps (Canvas2D native).
- **Testing:** pure module fully unit-tested with injected RNG; the Canvas component is render-only (visual smoke). Existing 162 unit + 11 e2e stay green.
- **Principles:** honesty (effects only for real triggered reactions, data from the timeline — no fabrication); event-sourcing untouched; data+contract (shared `VisualEffect[]`, two renderers).

## 7. Open question for review
The default plan keeps R2 to reaction effects and defers ambient (boiling/steam/etc.) to R3. If you'd prefer to fold a first ambient effect (e.g. boiling bubbles when T>373 K) into R2 to validate the particle system against state-derived effects sooner, that's a reasonable scope bump — but the clean split is R2 = reaction events, R3 = ambient state. **Recommendation: keep them separate** (R2 reaction-only), since the particle foundation is the same and R3 then only adds the pure `deriveAmbientEffects` + wiring.

## 8. Next step
On approval → `superpowers:writing-plans` for the R2 implementation plan, then subagent-driven execution. Branch: `feature/visual-lab-v2-r2-effects` (already created off main `1daa86f`).
