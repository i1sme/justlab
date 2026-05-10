# justlab

> Виртуальная химическая лаборатория для школы и самообразования. 2D таблица Менделеева, 3D-просмотрщик молекул и интерактивный лабораторный стол с реалистичной визуализацией реакций.

**Веб-приложение, целиком работающее в браузере.** Без бэкенда, без аккаунтов, без трекеров. SPA на SvelteKit, динамически грузит Three.js / OpenChemLib только когда нужно.

## Зачем это

Большинство онлайн-симуляторов химии либо платные (Labster, ChemCollective), либо узкоспециальные, либо требуют установки. Бесплатной, работающей в браузере, честной ([см. ниже](#принципы)) и одинаково подходящей школьнику и студенту — нет. Мы делаем такую.

## Целевые аудитории

В приложении первый запуск настраивает интерфейс под одну из трёх групп:

| Режим          | Кто                  | Что получает                                                      |
| -------------- | -------------------- | ----------------------------------------------------------------- |
| 🌱 **Новичок** | Самоучки, любопытные | Onboarding, глоссарий, всплывающие подсказки на каждый термин     |
| 🏫 **Школа**   | 5–11 класс           | Школьная программа, гейминг, безопасные сценарии, квесты          |
| 🎓 **Вуз**     | Студенты             | Полный контент: органика, спектры, кинетика, механизмы (в работе) |

Уровень переключается в любой момент через шапку.

## Что уже работает

- 📊 **Таблица Менделеева** — 2D с категориями, поиском и подробной карточкой; 3D-модель Бора атома по клику
- 🧪 **Просмотрщик молекул** — рендер из SMILES через OpenChemLib (Web Worker), курируемая библиотека ~50 веществ, 2D и 3D
- 📚 **Глоссарий** — определения терминов с поиском и кросс-ссылками
- ⚗️ **Лаборатория** — два режима подачи на выбор:
  - **Формальный** — карточки контейнеров, цифры температуры, текстовые описания (как в учебнике)
  - **Визуальный** — 3D-сцена со столом, бутылками реактивов, стеклянной посудой и эффектами реакций
- 🎯 **Квесты** — 5 курируемых заданий со школьной программы (получи поваренную соль, выдели водород, окрась пламя…)
- ⚠️ **GHS-пиктограммы** — иконки опасности рядом с реактивами
- ↻ **Перепроигрывание** реакций (для повторного просмотра анимации)
- 🌐 **i18n** — русский / английский, переключение «на лету»
- 🌗 **Тёмная тема** — автоматическая по `prefers-color-scheme`

## Принципы

Проект строится по жёстким правилам. Они закреплены в [CLAUDE.md](./CLAUDE.md):

1. **Доступность важнее красоты.** Цель — iPhone SE 2020 / Android-планшет 2018 года. Не работает на них — упрощаем.
2. **Производительность как фича.** Бюджет: ≤200 KB gzipped initial JS, ≤3s TTI на 4× throttled CPU, ≥30 FPS на 3D-сцене на iGPU.
3. **Реалистичность ≠ симуляция.** Никакой квантовой химии в браузере. Курируемая БД реакций + правиловый движок (нейтрализация, ряд активности, таблица растворимости) — всё проверяемая истина из учебника.
4. **Никогда не выдумываем продукты.** Если реакция не найдена ни в БД, ни в правилах — приложение **честно** говорит «реакция неизвестна», а не показывает ложную химию. Это образовательный продукт — доверие критично.
5. **Прогрессивное улучшение.** 2D работает везде. 3D — где есть WebGL2.
6. **Оффлайн-first** (планируется) — после первой загрузки приложение работает без интернета через service worker.

## Стек

- **[SvelteKit](https://svelte.dev/) + [Svelte 5](https://svelte.dev/) (Runes)** — реактивный UI без виртуального DOM, малый bundle. React не используем сознательно — слишком тяжёл для целевых устройств.
- **[Three.js](https://threejs.org/)** напрямую (без R3F) — для 3D-сцен (атом, молекулы, лаборатория). Грузится `import()` лениво, только при заходе на нужный экран.
- **[OpenChemLib-JS](https://github.com/cheminfo/openchemlib-js)** — парсинг SMILES, 2D/3D-рендер молекул. В Web Worker через [Comlink](https://github.com/GoogleChromeLabs/comlink).
- **[RDKit-JS](https://www.rdkit.org/docs/Cartridge.html)** (запланировано) — для расширенных молекулярных свойств.
- **[Tailwind v4](https://tailwindcss.com/)** + плагин typography — стилизация.
- **[Dexie](https://dexie.org/)** (IndexedDB, запланировано) — журнал экспериментов и оффлайн-кеш.
- **[lz-string](https://pieroxy.net/blog/pages/lz-string/)** (запланировано) — сжатие состояния эксперимента в URL для шеринга.
- **TypeScript strict**, **Vitest** + **Playwright** для тестов.
- **Без бэкенда.** Деплоится статикой (`@sveltejs/adapter-static`).

## Архитектура (важное)

- **Любой парсинг/расчёт — в Web Worker.** Главный поток только рендерит.
- **Адаптивное качество** — на старте детектится GPU через `navigator.gpu` / `WEBGL_debug_renderer_info`, выбирается preset `low` / `medium` / `high`.
- **Lab-state — event-sourcing**: `Action[]` журнал + чистый reducer (`src/lib/lab/lab-state.ts`). Это даёт undo, шеринг через URL и «машину времени» (планируется).
- **Reaction-engine двухступенчатый**:
  1. Точное совпадение в курируемой БД (`src/data/reactions/{category}.ts`)
  2. Fallback — правиловый движок (`src/lib/chemistry/reaction-rules.ts`) для нейтрализации / вытеснения / осаждения
- **3D-сцены изолированы** — `atom-scene.ts`, `molecule-scene.ts`, `lab-scene.ts` не пересекаются, общий только пакет `three`.
- **i18n с нулевого дня** — никаких хардкодных строк в UI.

Подробнее — в [CLAUDE.md](./CLAUDE.md).

## Структура проекта

```
src/
  data/
    elements.ts              # 118 элементов с метаданными
    substances.ts            # объединённый реестр substance (элементы + молекулы + неорганика)
    inorganic-substances.ts  # курируемые соли/гидроксиды/оксиды (~28 шт)
    molecules.ts             # органика и др. молекулы
    reactions/               # реакции по категориям, lazy-load
    chemistry-rules.ts       # таблицы знаний: растворимость, ряд активности, ионы
    quests.ts                # школьные мини-задания
    glossary.ts              # термины
    types.ts                 # доменные типы (Substance, Reaction, Experiment, Action)
  lib/
    chemistry/   # reaction-engine, reaction-rules, electron-config, CPK
    render3d/    # Three.js: atom-scene, molecule-scene, lab-scene
    render2d/    # 2D-канвас структуры
    workers/     # web worker entry points (OpenChemLib)
    lab/         # lab-state (reducer), lab-store (Svelte 5 runes), reaction-playback, quest-store
    settings/    # глобальные настройки (motionEnabled, userMode, locale, labView)
    i18n/        # ru.json / en.json + reactive store
    storage/     # Dexie (planned)
    ui/          # все Svelte-компоненты
  routes/
    +page.svelte           # таблица Менделеева
    /molecule              # просмотрщик молекул
    /glossary              # глоссарий
    /lab                   # виртуальная лаборатория
e2e/                       # Playwright тесты
```

## Быстрый старт

Требования: **Node.js ≥ 20**, npm.

```bash
git clone <repo-url>
cd justlab
npm install
npm run dev          # http://localhost:5173
```

Прочие команды:

```bash
npm run check        # svelte-check (TypeScript + Svelte)
npm run lint         # prettier + eslint
npm run format       # prettier --write
npm run test:unit    # Vitest (~130 unit-тестов, ~250ms)
npm run test:e2e     # Playwright (smoke + lab)
npm run test         # unit + e2e разом
npm run build        # production build → /build (статика)
npm run preview      # запустить prod-сборку локально
```

Тесты на момент написания: **130/130 unit ✓ · 11/11 e2e ✓**.

## Дорожная карта

Текущий статус — **в активной разработке**, идёт фаза **6b** (визуальная 3D-лаборатория).

- [x] **MVP**: 2D-таблица + 3D-атом, просмотрщик молекул, глоссарий
- [x] **v0.2**: домен Substance/Reaction, БД ~20 реакций, журнал событий
- [x] **v0.3**: квесты, GHS, two-level (школа/вуз), правиловый движок реакций
- [ ] **v0.4** (в работе): 3D-лаборатория (бутылки, посуда, нагреватель), шаринг через URL, service worker (offline)
- [ ] **v0.5**: учебные модули, экспорт в PDF, AR-режим (WebXR)
- [ ] **v1.0**: полный i18n, accessibility-аудит, продакшн-релиз

## Тестирование

- **Unit (Vitest)** — chemistry, parsers, утилиты, reducer лабораторного состояния, правиловый движок
- **E2E (Playwright)** — golden path: открыть таблицу → выбрать элемент → собрать реакцию → увидеть результат
- **Integrity-тесты БД реакций** — каждая реакция использует существующие substance ID, timeline валиден, нет дубликатов

## Соглашения

- TypeScript **strict**.
- Названия атомов/элементов — IUPAC символы (`H`, `Na`, `Fe`), не локализованные.
- SMILES — primary canonical representation для молекул.
- Координаты атомов — в ангстремах (Å) внутри chemistry-слоя.
- Цвета атомов — стандарт CPK (Corey-Pauling-Koltun).

## Лицензия

TBD — см. [LICENSE](./LICENSE), когда появится.

## Контрибьютинг

Проект пока в активной экспериментальной разработке, API меняется. Если хочется поучаствовать — открой issue с идеей или вопросом, обсудим. PR welcome, но рекомендуется сначала согласовать направление, чтобы не делать впустую.

Перед коммитом проверь, что проходит:

```bash
npm run check && npm run lint && npm run test:unit -- --run && npm run build
```

---

## English summary

**justlab** is a free, browser-based virtual chemistry lab for students and self-learners. It combines a periodic table, an interactive 3D molecule viewer, and a virtual lab bench with realistic reaction visualisation.

**Key principles:**

- **No fabrication.** If a reaction isn't in the curated database or derivable from textbook rules (neutralisation, activity series, solubility), the app honestly says "reaction unknown" rather than inventing products.
- **Performance as a feature.** Targets iPhone SE 2020 / 2018 Android tablets. Budget: ≤200 KB gzipped initial JS, ≤3s TTI, ≥30 FPS for 3D on integrated GPUs.
- **Three audiences:** Beginner / School / University — the UI adapts depth and language to the chosen mode.
- **Offline-first** (planned) — fully functional without internet after first load.

**Stack:** SvelteKit + Svelte 5 (Runes), Three.js (lazy-loaded), OpenChemLib in Web Worker via Comlink, Tailwind v4, TypeScript strict, Vitest + Playwright. **No backend** — pure SPA, deployable as static files.

**Status:** active development, currently building the 3D visual lab (Phase 6b). 130 unit tests + 11 e2e tests passing.

**Quick start:** `npm install && npm run dev` (Node ≥ 20).

See [CLAUDE.md](./CLAUDE.md) for detailed architectural rules and contributor guidelines.
