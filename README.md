# justlab

**English** | [Русский](./README.ru.md)

> A virtual chemistry lab for school and self-learners. 2D periodic table, 3D molecule viewer, and an interactive lab bench with realistic reaction visualisation.

**Runs entirely in the browser.** No backend, no accounts, no trackers. SPA built on SvelteKit; Three.js / OpenChemLib are loaded dynamically only when needed.

## Why this exists

Most online chemistry simulators are either paywalled (Labster, ChemCollective), narrowly specialised, or require installation. There isn't a good free, browser-based, **honest** ([see below](#principles)), and equally suitable-for-school-and-university alternative. We're building one.

## Audiences

The first-run wizard tailors the UI to one of three modes:

| Mode              | Who                        | What they get                                                        |
| ----------------- | -------------------------- | -------------------------------------------------------------------- |
| 🌱 **Beginner**   | Self-learners, the curious | Onboarding, glossary, term-by-term tooltips                          |
| 🏫 **School**     | Grades 5–11                | School curriculum, gamified flow, safe scenarios, quests             |
| 🎓 **University** | Students                   | Full content: organic chemistry, spectra, kinetics, mechanisms (WIP) |

The mode can be switched at any time from the header.

## What's working today

- 📊 **Periodic table** — 2D with categories, search, and a detailed card; click an element to spawn a 3D Bohr model of the atom
- 🧪 **Molecule viewer** — renders from SMILES via OpenChemLib (Web Worker), curated library of ~50 substances, both 2D and 3D
- 📚 **Glossary** — term definitions with search and cross-references
- ⚗️ **Lab** — two presentation modes:
  - **Formal** — container cards, numeric temperatures, textual descriptions (textbook-style)
  - **Visual** — 3D scene with bench, reagent bottles, glassware, and reaction effects
- 🎯 **Quests** — 5 curated school-curriculum tasks (make table salt, evolve hydrogen, colour a flame…)
- ⚠️ **GHS pictograms** — hazard icons next to reagents
- ↻ **Reaction replay** — re-run the animation on demand
- 🌐 **i18n** — English / Russian, switch on the fly
- 🌗 **Dark mode** — automatic via `prefers-color-scheme`

## Principles

The project follows hard rules pinned in [CLAUDE.md](./CLAUDE.md):

1. **Accessibility over aesthetics.** Target devices: iPhone SE 2020 / 2018 Android tablet. If a feature doesn't run there, we simplify.
2. **Performance is a feature.** Budget: ≤200 KB gzipped initial JS, ≤3s TTI on 4× throttled CPU, ≥30 FPS for 3D on integrated GPUs.
3. **Realism ≠ simulation.** No quantum chemistry in the browser. We use a curated reaction database plus a rule-based engine (neutralisation, activity series, solubility table) — every output is verifiable textbook truth.
4. **Never invent products.** If a reaction isn't in the database and isn't derivable from the rules, the app **honestly** says "reaction unknown" instead of showing fake chemistry. This is an educational product — trust is critical.
5. **Progressive enhancement.** 2D works everywhere. 3D wherever WebGL2 exists.
6. **Offline-first** (planned) — fully functional without internet after first load via service worker.

## Stack

- **[SvelteKit](https://svelte.dev/) + [Svelte 5](https://svelte.dev/) (Runes)** — reactive UI without a virtual DOM, small bundle. We deliberately avoid React — too heavy for our target devices.
- **[Three.js](https://threejs.org/)** directly (no R3F) — for 3D scenes (atom, molecules, lab). Loaded with `import()` lazily, only when the relevant screen is opened.
- **[OpenChemLib-JS](https://github.com/cheminfo/openchemlib-js)** — SMILES parsing, 2D/3D molecule rendering. Runs in a Web Worker via [Comlink](https://github.com/GoogleChromeLabs/comlink).
- **[RDKit-JS](https://www.rdkit.org/docs/Cartridge.html)** (planned) — for advanced molecular properties.
- **[Tailwind v4](https://tailwindcss.com/)** + typography plugin — styling.
- **[Dexie](https://dexie.org/)** (IndexedDB, planned) — experiment journal and offline cache.
- **[lz-string](https://pieroxy.net/blog/pages/lz-string/)** (planned) — compresses experiment state into URL hashes for sharing.
- **TypeScript strict**, **Vitest** + **Playwright** for tests.
- **No backend.** Ships as static files (`@sveltejs/adapter-static`).

## Architecture (the important bits)

- **All parsing/computation happens in Web Workers.** The main thread only renders.
- **Adaptive quality** — on startup the GPU is detected via `navigator.gpu` / `WEBGL_debug_renderer_info`, and a `low` / `medium` / `high` preset is chosen.
- **Lab state is event-sourced**: an `Action[]` log fed through a pure reducer (`src/lib/lab/lab-state.ts`). This enables undo, URL sharing, and a "time machine" (planned).
- **The reaction engine is two-staged**:
  1. Exact match in the curated database (`src/data/reactions/{category}.ts`)
  2. Fallback — rule-based engine (`src/lib/chemistry/reaction-rules.ts`) for neutralisation / displacement / precipitation
- **3D scenes are isolated** — `atom-scene.ts`, `molecule-scene.ts`, `lab-scene.ts` don't share code; they only share the `three` package.
- **i18n from day one** — no hard-coded UI strings.

See [CLAUDE.md](./CLAUDE.md) for the full set of architectural rules.

## Project layout

```
src/
  data/
    elements.ts              # 118 elements with metadata
    substances.ts            # unified substance registry (elements + molecules + inorganic)
    inorganic-substances.ts  # curated salts/hydroxides/oxides (~28 entries)
    molecules.ts             # organics and other molecules
    reactions/               # reactions per category, lazy-loadable
    chemistry-rules.ts       # knowledge tables: solubility, activity series, ions
    quests.ts                # school mini-quests
    glossary.ts              # term definitions
    types.ts                 # domain types (Substance, Reaction, Experiment, Action)
  lib/
    chemistry/   # reaction-engine, reaction-rules, electron-config, CPK
    render3d/    # Three.js: atom-scene, molecule-scene, lab-scene
    render2d/    # 2D canvas structure rendering
    workers/     # web worker entry points (OpenChemLib)
    lab/         # lab-state (reducer), lab-store (Svelte 5 runes), reaction-playback, quest-store
    settings/    # global settings (motionEnabled, userMode, locale, labView)
    i18n/        # ru.json / en.json + reactive store
    storage/     # Dexie (planned)
    ui/          # all Svelte components
  routes/
    +page.svelte           # periodic table
    /molecule              # molecule viewer
    /glossary              # glossary
    /lab                   # virtual lab
e2e/                       # Playwright tests
```

## Quick start

Requires **Node.js ≥ 20** and npm.

```bash
git clone <repo-url>
cd justlab
npm install
npm run dev          # http://localhost:5173
```

Other commands:

```bash
npm run check        # svelte-check (TypeScript + Svelte)
npm run lint         # prettier + eslint
npm run format       # prettier --write
npm run test:unit    # Vitest (~130 unit tests, ~250ms)
npm run test:e2e     # Playwright (smoke + lab)
npm run test         # unit + e2e together
npm run build        # production build → /build (static)
npm run preview      # serve the prod build locally
```

Tests at the time of writing: **130/130 unit ✓ · 11/11 e2e ✓**.

## Roadmap

Status — **active development**, currently in phase **6b** (visual 3D lab).

- [x] **MVP**: 2D table + 3D atom, molecule viewer, glossary
- [x] **v0.2**: Substance/Reaction domain, ~20-reaction DB, action journal
- [x] **v0.3**: quests, GHS, two-level (school/university), rule-based reaction engine
- [ ] **v0.4** (in progress): 3D lab (bottles, glassware, heating plate), URL sharing, service worker (offline)
- [ ] **v0.5**: learning modules, PDF export, AR mode (WebXR)
- [ ] **v1.0**: full i18n polish, accessibility audit, production release

## Testing

- **Unit (Vitest)** — chemistry, parsers, utilities, lab-state reducer, rule-based engine
- **E2E (Playwright)** — golden path: open the table → pick an element → assemble a reaction → see the result
- **Reaction DB integrity tests** — every reaction references existing substance IDs, timeline is valid, no duplicate IDs

## Conventions

- TypeScript **strict**.
- Atom and element names are IUPAC symbols (`H`, `Na`, `Fe`), never localised.
- SMILES is the primary canonical molecule representation.
- Atom coordinates live in ångströms (Å) inside the chemistry layer.
- Atom colours use the standard CPK (Corey-Pauling-Koltun) palette.

## License

TBD — see [LICENSE](./LICENSE) once it's added.

## Contributing

The project is in active experimental development, and the API still moves around. If you'd like to get involved, please open an issue with the idea or question first so we can align direction. PRs are welcome, but coordination beats wasted effort.

Before committing, please make sure these still pass:

```bash
npm run check && npm run lint && npm run test:unit -- --run && npm run build
```
