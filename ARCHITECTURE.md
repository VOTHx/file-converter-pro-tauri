# Converter Pro — Architecture Document

Status: planning only, no code changes in this pass. Written against the
current real codebase (all 6 tools ported, reviewed) — not aspirational.

## CTO summary — open decisions before building further

- **AI Utilities**: no folder gets real content until offline-vs-cloud is
  decided. Bundled models (real disk cost) or a cloud API (breaks offline
  positioning, needs a backend) are different projects, not a config flag.
- **Video**: likely needs `ffmpeg` bindings — real size/compile-time cost,
  works against the "small app, runs on old hardware" goal this project has
  optimized for since the Electron→Tauri switch. Needs a go/no-go, not a
  silent yes.
- **Audio**: lower-risk than Video — a Rust crate like `symphonia` fits the
  existing "local processing, no internet" model fine.
- **Mobile-first**: this doc assumes "responsive to a narrow window" (already
  built, same pattern as the sidebar drawer), not "runs on an actual phone"
  (Tauri v1 has no mobile target — that's a Tauri v2 migration).
- **TypeScript**: scoped as its own phase (below), not folded silently into
  new feature work — it touches every existing file, not just new ones.

---

## 1. Folder Structure

Feature-based, so adding a category means adding one folder, not touching
unrelated code:

```
src/
  app/
    App.tsx
    providers/
      ToastProvider.tsx        (renamed from hooks/useToast.jsx)
  features/                     ← the scaling unit
    documents/
      components/
      hooks/
      utils/
      DocumentsPage.tsx
    images/
      components/   ConvertImagesTool, ImageToBase64Tool, ResizeImagesTool,
                     CompressImagesTool, ImageThumbnailList
      ImagesPage.tsx
    archives/        (renamed from "zip" — room for .tar/.7z later)
      components/   ExtractArchiveTool, BundleArchiveTool
      ArchivesPage.tsx
    dev-tools/
      components/   JsonFormatterTool, UuidGeneratorTool, HashGeneratorTool,
                     UrlEncodeTool, ColorConverterTool, JwtDecoderTool
      DevToolsPage.tsx
    productivity/
      components/
      ProductivityPage.tsx
    audio/            ← scaffolded only, pending Rust crate decision
    video/            ← scaffolded only, pending ffmpeg/size decision
    ai-utilities/     ← no folder until offline-vs-cloud is decided
  shared/              ← cross-feature reusable code (today's src/components,
                          src/hooks, src/utils — already roughly this shape)
    components/
      ui/             Card, StatCard, ToolCard, SplitPanel, ToastContainer
      layout/         Sidebar, Header
    hooks/
      useLocalStorage.ts, useIsDesktop.ts, useToast.tsx,
      useCopyToClipboard.ts, useConversionStats.ts, useConversionHistory.ts,
      useFavorites.ts, useTauriCommand.ts (new — see §7)
    utils/
      hash.ts, color.ts, jwt.ts, bytes.ts (new — see §6), tauri.ts (new)
    types/
      tauri.ts         Typed shapes for each Rust command's return value
  pages/
    Dashboard.tsx       composes feature "quick access" cards only —
                         no feature logic lives here, same as today
  toolsMeta.ts           becomes a registry each feature module adds itself to
```

Text & Data (today's name) is folded into **Documents** going forward, since
JSON/CSV/XML/YAML/Base64 text conversion is one slice of a broader "document
processing" category once PDF/Office formats are added.

## 2. Routing Strategy

Today: a flat lookup object in `App.jsx` (`PAGES[activeSection]`), no router
library, no URL. That's the right call for 6 pages and stays mostly right —
**no react-router is being proposed.** This is a desktop window, not a web
app; a URL bar has no purpose here, and Tauri's `location.hash` is unused.

What changes: the route shape goes from a single string to two levels —
`{ category: 'documents', tool: 'pdf-merge' }` via a small `useAppRoute`
hook replacing the current `activeSection` string. The sidebar keeps mapping
to **8 top-level categories only**; individual tools get in-category
navigation. This formalizes a pattern that already exists informally —
Dev Tools already stacks 6 widgets on one page; once a category like
Documents has 5+ tools, that stack becomes explicit tabs/sub-nav instead of
one long scroll.

## 3. Data Flow

Three flows exist today and should stay separate rather than collapsing into
one "state management" concept:

1. **Conversion execution** (ephemeral, per-tool): input → component state →
   `invoke(...)` → Rust command → result → component state → render. Never
   touches `localStorage` directly. Scoped per-tool today, stays that way —
   a Documents command has nothing to do with an Images one.
2. **Persisted app state** (cross-cutting): `useConversionStats`,
   `useConversionHistory`, `useFavorites` — all already built on the shared
   `useLocalStorage` primitive. New categories plug into the *same* system
   by calling `recordConversion(toolId)` — no new persistence layer needed.
3. **Toasts**: context-based (`ToastProvider`), already global. No change
   needed as categories grow.

## 4. Component Hierarchy

```
App
 └─ ToastProvider (context)
     ├─ Sidebar (8 categories + History)
     ├─ Header (search, theme, profile)
     └─ <ActiveCategoryPage>
          ├─ CategorySubNav   (new — only appears once a category has >1
          │                     tool; Dev Tools/Images/Archives already have
          │                     this informally as stacked cards)
          └─ <ActiveTool>
               └─ feature widgets, built from shared/components/ui
                  primitives (Card, etc.) — same pattern every ported
                  tool already follows
```

## 5. State Management

**Recommendation: no Redux/Zustand/Jotai at 8 categories.** Reasoning:

- Every tool's input/output is local, ephemeral `useState` — correct today,
  no reason to lift it as categories grow.
- Cross-cutting concerns (stats, history, favorites, theme, toasts) are
  already small, focused hooks/contexts, each proven across 6 categories.
- The only real risk at scale is prop-drilling through a deep
  category→tool→widget tree — already mitigated by keeping the things that
  need to be global (toasts) on context, and leaving the rest
  (stats/history/favorites) as independent localStorage readers, which is
  fine unless two screens need to show live-syncing state simultaneously —
  not a case that exists yet.

Introducing a global store now would add indirection with no matching
benefit at this app's actual complexity.

## 6. Utility Structure

Promote `shared/utils/` from "a few helpers" to a real per-domain set:

- `hash.ts`, `color.ts`, `jwt.ts` — unchanged, just relocated/typed.
- `bytes.ts` (new) — `formatBytes()` is currently duplicated inline; extract
  once.
- `tauri.ts` (new) — thin typed wrappers: `invoke<T>(cmd, args)`,
  `pickFile()`, `pickFiles()`, `pickDirectory()`, `saveDialog()`. Every
  ported tool today hand-writes its own `window.__TAURI__.dialog.open({...})`
  call with slightly different inline options — this is the highest-value
  near-term consolidation, both for consistency and because it's the
  natural place to put the try/catch → `showToast` pattern every tool
  currently repeats.

Category-specific helpers (e.g. a PDF text-extraction helper) live in
`features/<category>/utils/`, not `shared/`.

## 7. Hooks Structure

```
shared/hooks/
  useLocalStorage.ts, useIsDesktop.ts, useToast.tsx, useCopyToClipboard.ts,
  useConversionStats.ts, useConversionHistory.ts, useFavorites.ts   (existing)
  useTauriCommand.ts   (new)
features/<category>/hooks/
  (category-specific only, e.g. useDocumentMerge for a multi-step flow)
```

`useTauriCommand` is the second highest-value extraction: every "Convert
All"-style button today repeats the identical shape —
`setIsRunning(true); try { await invoke(...) } catch { showToast(...) }
finally { setIsRunning(false) }` — across `ConvertImagesTool`,
`ResizeImagesTool`, `CompressImagesTool`, `ExtractZipTool`, `BundleZipTool`.
One hook collapses that into `const { run, isRunning } =
useTauriCommand('resize_images')`.

## 8. Future Scaling Strategy

**Ready to extend today** (same architecture as the current 6 tools, no new
infrastructure): Documents (PDF merge/split via mature Rust crates like
`lopdf`), Productivity Tools (likely pure-JS, same shape as most of Dev
Tools), more Archive formats, more Dev Tools widgets.

**Needs an explicit decision first** (see CTO summary above): Audio, Video,
AI Utilities.

**TypeScript migration**: its own phase, done before Documents/Productivity
are built — converting ~30 existing files, typing the Tauri command
boundary (exactly where `shared/types/tauri.ts` above would live, matching
each Rust command's real return shape) and the existing hooks. Writing new
categories in TS from day one beats writing them in JS and migrating twice.
