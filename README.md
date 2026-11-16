# File Converter Pro (Tauri)

Same features as the Electron version — Text/JSON/CSV/XML/Base64, image conversion
(PNG/JPG/WebP/BMP), zip extract/create — rebuilt to produce a ~5–15MB app instead
of ~250MB. I have not been able to compile this myself (no Rust available in my
environment) — if the first build throws an error, paste it back to me.

## One-time setup (do this before opening the project)

1. **Install Rust**: go to https://rustup.rs, download and run `rustup-init.exe`.
   Accept the default options. This installs `rustc` (compiler) and `cargo`
   (package manager/build tool).
2. **Install Microsoft C++ Build Tools** (Rust needs this to link on Windows):
   go to https://visualstudio.microsoft.com/visual-cpp-build-tools/, download
   and run the installer, and in the installer check **"Desktop development
   with C++"**. This is a multi-GB download — it's the standard Windows C++
   toolchain, not something unusual.
3. Restart your computer (or at least restart VS Code) so the new PATH entries
   take effect.
4. Verify in a terminal:
   ```
   rustc --version
   cargo --version
   ```
   Both should print version numbers.

## Running it

1. Open this folder (`file-converter-pro-tauri`) in VS Code.
2. Open a terminal (`Terminal > New Terminal`) and run:
   ```
   npm install
   npm run dev
   ```
   The first run will take a while — Cargo is compiling every Rust dependency
   from source. Later runs are fast (it's cached).

## Before building the real installer

Tauri needs actual icon files to bundle the app — they don't exist yet in this
project. Generate them from any square image (ideally 1024×1024 PNG) you own
the rights to:

```
npx tauri icon path/to/your-square-image.png
```

This fills in `src-tauri/icons/`. Then build:

```
npm run build
```

The installer (`.msi` and `.exe` via NSIS) will be in
`src-tauri/target/release/bundle/`.

**Code signing note:** same as before — this build is unsigned, so Windows
SmartScreen will warn "Unknown Publisher" until you buy a code signing
certificate later, if/when you sell this.

## Dev Tools tab (new)

JSON Pretty Print/Minify/Validate/Sort Keys, UUID generator, Hash generator
(MD5/SHA-256/SHA-512), URL encode/decode, and a HEX/RGB/HSL color converter.
All of these run entirely in JavaScript (JSON.parse/stringify, the browser's
built-in `crypto.subtle` for SHA, a hand-written MD5, `crypto.randomUUID()`,
regex/math for URL and color) — no new Rust dependencies, so this didn't
slow down the build. Copy and Download buttons were also added to the main
Text & Data converter's output (Download uses a new small Rust command,
`write_text_file`, to save wherever you pick).

Keyboard shortcuts (Text & Data panel only, for now): Ctrl+Enter to convert,
Ctrl+Shift+C to copy the output.

## Responsive hardening pass — 320/768/1024/1440/UltraWide (new)

Dashboard/Sidebar/Header/Search/Mobile Nav/Theme already existed from
earlier phases — this pass specifically targeted the breakpoint range,
since 768px/1024px were already handled and 320px/1440px/UltraWide weren't.

- `src-tauri/tauri.conf.json`: added `minWidth: 320, minHeight: 480` — the
  window can no longer be resized smaller than that floor.
- `src/pages/Dashboard.jsx`, `src/pages/HistoryPage.jsx`: added
  `max-w-7xl mx-auto`, matching the cap every other page (Text & Data, Dev
  Tools, Images, Zip) already had. This is what actually fixes 1440px/
  UltraWide — the fix is capping content width, not adding more grid
  columns (there are only 4 tool cards; a 5th column tier would have
  nothing to show in it).

Deliberately did **not** add a custom Tailwind breakpoint for "UltraWide" —
the `max-w-7xl` cap means content stays well-proportioned at any width
beyond it, so a new named breakpoint would be unused config with no content
to put in it.

## Zip — ported for real, all tools now live (new)

Both features ported: Extract a .zip, and Bundle files into a .zip. Same
Rust commands as before (`extract_zip`, `files_to_zip`), no backend changes.

**This was the last placeholder** — all 6 sidebar sections are now real
pages. `App.jsx` got a cleanup pass as a result: the `SECTION_META`/
`ComingSoonSection` routing logic is gone (nothing used it anymore — a
6-page routing table replaced it). `src/pages/ComingSoonSection.jsx` itself
is left in place, just unused, in case a future new tool category needs the
same "not built yet" pattern again.

Not carried over from the vanilla app in this pass: drag-and-drop onto the
zip dropzones (the vanilla app had this; this port uses dialog-based picking
only, same scope level as Images and Dev Tools). Flag if you want that added.

New: `src/components/zip/ExtractZipTool.jsx`, `BundleZipTool.jsx`,
`src/pages/ZipPage.jsx`. Changed: `src/App.jsx`.

## Images — ported for real (new)

All 4 features ported: batch Convert (PNG/JPG/WebP/BMP), Image → Base64
(plain or as a `data:` URI), Resizer (with maintain-aspect-ratio toggle), and
Compressor (JPEG quality, shows before/after size). Same Rust commands as
before (`convert_images`, `image_to_base64`, `resize_images`,
`compress_images`) — no backend changes for the logic itself.

**One real config change was needed**: actual thumbnail previews (new this
round — the vanilla app only showed filenames) require Tauri's asset
protocol, which is off by default for security reasons. Added to
`src-tauri/tauri.conf.json`:
```json
"protocol": { "asset": true, "assetScope": ["**"] }
```
`assetScope: ["**"]` is broad — it lets the webview load any local file as
an image. Worth knowing, but not a new risk in practice: the Rust backend
already reads arbitrary user-picked paths for the conversion logic itself,
so this doesn't expand what the app can touch — it only lets the *UI* show
a preview of files the user explicitly picked via the native dialog.

New: `src/components/images/ImageThumbnailList.jsx` (reusable — shows a
thumbnail grid from file paths via `convertFileSrc`, falls back to a broken-
image icon if a preview fails to load), `ConvertImagesTool.jsx`,
`ImageToBase64Tool.jsx`, `ResizeImagesTool.jsx`, `CompressImagesTool.jsx`,
`src/pages/ImagesPage.jsx`.

Changed: `src-tauri/tauri.conf.json`, `src/App.jsx` (routes `images` to the
real page; only `zip` remains pending).

## Dev Tools — ported for real (new)

Dev Tools is no longer a "coming soon" screen — all 6 widgets from the
vanilla app are ported: JSON Formatter (Pretty/Minify/Validate/Sort Keys),
UUID Generator, Hash Generator (MD5/SHA-256/SHA-512), URL Encode/Decode,
Color Converter (HEX/RGB/HSL), JWT Decoder. None of these need Rust/Tauri —
they're all pure JavaScript, same as in the old app, so this was the
lowest-risk of the three remaining tools to port.

New: `src/hooks/useCopyToClipboard.js` (reusable — wraps clipboard write +
toast feedback, used by every widget with a Copy button), `src/utils/hash.js`,
`src/utils/color.js`, `src/utils/jwt.js` (logic ported verbatim from
`src-legacy/renderer.js`), `src/components/devtools/*.jsx` (6 widgets),
`src/pages/DevToolsPage.jsx`.

Changed: `src/App.jsx` (routes `devtools` to the real page instead of
ComingSoonSection; only `images` and `zip` remain pending).

Not carried over from Dev Tools' stats/history: these widgets don't call
`recordConversion`/`addEntry` — the vanilla app never tracked them either
(that was specific to Text & Data), so this preserves existing behavior
rather than inventing new scope.

## Code review + refactor pass (new)

Reviewed every file generated so far as a React engineer, UI/UX engineer,
security engineer, and performance engineer. Real findings only — nothing
invented to pad out the list:

**Fixed:**
- `SplitPanel` and `HistoryPage` were each rendering their content **twice**
  (a desktop version and a mobile version, toggled with CSS `hidden`) instead
  of once — doubled DOM nodes, and resizing the window across the breakpoint
  lost cursor position because you were actually jumping between two separate
  `<textarea>` elements. New shared hook `src/hooks/useIsDesktop.js` fixes
  this in both places — renders one version, chosen by actual viewport width.
- Sidebar's active and hover states used the **identical** CSS class in dark
  mode (`bg-neutral-800`) — visually indistinguishable, which is almost
  certainly what caused the "clicking Zip does nothing" confusion earlier.
  Active now gets a left accent border + tinted background; hover stays plain.
- Mobile drawer had no Escape-to-close and didn't move focus into itself when
  opened — both fixed in `Sidebar.jsx`.
- Toast auto-dismiss timers weren't cancelled on manual dismiss (harmless,
  but sloppy) — fixed in `useToast.jsx`.
- `ToolCard`/`Dashboard` were creating a brand-new function per card on every
  render, which would silently defeat any memoization. `ToolCard` now takes
  an `id` and calls callbacks with it directly, so `Dashboard` can pass the
  same stable function reference to every card; `ToolCard` is now wrapped in
  `React.memo`, and `App.jsx`'s `navigate`/`toggleTheme` are `useCallback`'d
  so that stability actually propagates.
- Added missing accessible names: search input (`aria-label` via a visually
  hidden `<label>`), decorative icons marked `aria-hidden`, history table's
  action column gets a screen-reader-only header.

**Checked and confirmed NOT an issue** (reporting this honestly rather than
inventing problems to seem thorough): no XSS risk anywhere in the React
layer — JSX auto-escapes all text, nothing uses `dangerouslySetInnerHTML`;
no secrets or actual conversion content ever touch `localStorage`, only
metadata (tool id, mode label, timestamp); Tailwind `dark:` variants are
applied consistently everywhere, no arbitrary-value misuse found.

Changed files: `src/hooks/useToast.jsx`, `src/components/SplitPanel.jsx`,
`src/components/Sidebar.jsx`, `src/components/Header.jsx`,
`src/pages/HistoryPage.jsx`, `src/App.jsx`, `src/components/ToolCard.jsx`,
`src/pages/Dashboard.jsx`. New: `src/hooks/useIsDesktop.js`.

## Text & Data → SaaS workspace (new)

New: `src/hooks/useToast.jsx` (context-based — `ToastProvider` wraps the whole
app in `App.jsx`, `useToast()` works from any page, not just this one, so
Images/Zip/Dev Tools can use the same toasts when they're ported later),
`src/components/ToastContainer.jsx`, `src/components/SplitPanel.jsx` (generic
resizable two-pane layout — also reusable for later pages, stacks vertically
below the `md` breakpoint).

Changed: `src/pages/TextDataPage.jsx` (full rewrite — split panel with a
draggable divider, Copy/Download buttons on the output pane, auto-format for
JSON-output modes and JSON→XML specifically, a loading spinner on Convert,
toast notifications instead of inline status text, Ctrl+Enter/Ctrl+Shift+C),
`src/App.jsx` (wraps everything in `ToastProvider`, renders `ToastContainer`).

Conversion logic itself is untouched — same Rust `convert_text` call, same
modes, same stats/history recording. "Auto format output" only reformats
JSON-output modes (already pretty from the backend, so this is a safety net,
not a visible change) and JSON→XML specifically (the backend emits that one
on a single line, so this is where auto-format is actually visible).

## Favorites — Phase 4 (new)

New: `src/hooks/useFavorites.js` (toggle/check favorited tool IDs, persisted
in `localStorage` under `fcp-favorite-tools`).

Changed: `src/components/ToolCard.jsx` (star toggle button, top-right corner
of every card — filled yellow when favorited), `src/pages/Dashboard.jsx` (a
"Pinned" section appears above "All Tools" whenever at least one tool is
favorited; Pinned is intentionally not affected by the search box — it's
meant to always be visible, not something you search for).

## Conversion History — Phase 3 (new)

New: `src/hooks/useConversionHistory.js` (timestamped log, capped at 100 entries,
`deleteEntry`/`clearHistory`), `src/toolsMeta.js` (pulled the duplicated tool
list out of Dashboard into one shared file — Dashboard and the new History page
both import from it now), `src/pages/HistoryPage.jsx`.

History shows as a table on desktop and switches to a card list on mobile/narrow
windows (same `md:` breakpoint the sidebar drawer already uses). Search filters
by tool name or detail text. New sidebar entry: **History**.

Changed: `src/components/Sidebar.jsx` (added the History nav item),
`src/pages/Dashboard.jsx` (now imports from `toolsMeta.js` instead of its own
copy), `src/pages/TextDataPage.jsx` (now logs a history entry on every successful
conversion, not just a stats count), `src/App.jsx` (routes to HistoryPage).

Note: history only has entries from Text & Data right now, for the same reason
stats started at zero last phase — Images/Zip/Dev Tools aren't wired into the
React shell yet.

## Dashboard statistics — Phase 2 (new)

New: `src/hooks/useLocalStorage.js` (generic, reusable), `src/hooks/useConversionStats.js`
(total / today / per-tool / files-processed, built on top of it), `src/components/StatCard.jsx`,
and `src/pages/TextDataPage.jsx`.

**Why Text & Data got ported in this phase, not later as originally planned**: a stats
system with zero real conversions feeding it would just show zeroes forever. Text & Data
is now a real, working page (core conversions only — no Copy/Download, auto-detect, or
history yet, those stayed in `src-legacy`) so there's a genuine `recordConversion('text')`
call happening when you actually convert something. Images/Zip/Dev Tools still show the
Phase 3/4 "migrating" screen.

One label deviation worth flagging: you asked for a "Favorite Tools" card: I built it as
"Favorite Tool" (singular) showing the single top tool by conversion count, since a plural
label over one value read oddly. Say if you want it changed (e.g. a ranked list instead).

Stats persist in `localStorage` under `fcp-conversion-stats` and survive app restarts.
There's no reset button in the UI yet — `resetStats()` exists on the hook if you want one
wired in.

## Dashboard shell — Phase 1 (new, big structural change)

The frontend is now React + Tailwind + Vite + lucide-react instead of plain
HTML/JS. What changed on disk:

- **`src-legacy/`** — the old working frontend (`index.html` + `renderer.js`),
  untouched, kept as a reference. It is no longer wired into the build.
- **`src/`** — brand new React app: `main.jsx`, `App.jsx`,
  `components/Sidebar.jsx`, `components/Header.jsx`, `components/Card.jsx`,
  `components/ToolCard.jsx`, `pages/Dashboard.jsx`, `pages/ComingSoonSection.jsx`.
- **`index.html`** — moved to the project root (Vite's required location).
- **`vite.config.js`, `tailwind.config.js`, `postcss.config.js`** — new build
  config.
- **`src-tauri/tauri.conf.json`** — `devPath`/`distDir` now point at Vite
  (`http://localhost:1420` in dev, `../dist` when built) instead of the old
  static `src/` folder. `beforeDevCommand`/`beforeBuildCommand` auto-run Vite.
- **The Rust backend (`src-tauri/src/`) was not touched at all.**

**What Phase 1 actually does**: sidebar (desktop fixed + mobile drawer),
header with a working search (filters the 4 tool cards live), a static
profile area (no real accounts — this is still an offline desktop app, not a
hosted product), a dashboard homepage, and dark/light theme toggle. Clicking
into Text & Data / Images / Zip / Dev Tools shows an honest "migrating in
Phase 2/3/4" screen — **the real converters are not live in this new shell
yet.** They still fully work in `src-legacy/` if you want to use them while
Phase 2+ is being built — that just needs `tauri.conf.json`'s `build` block
reverted to point at `../src-legacy` instead of Vite/`dist`.

Since the dependency list changed substantially (React, Vite, Tailwind,
lucide-react added), run `npm install` again before `npm run dev` — expect
more packages to download than before, though this is all JS/npm, not Rust,
so no Cargo recompile is triggered by this change alone.

## Batch 2a (archived — see src-legacy, not yet ported to the new shell)

JWT Decoder (Dev Tools — decodes header/payload only, does not verify the
signature), Light/Dark theme toggle (bottom of sidebar, saved locally),
auto-detect format (shows a guess above the Text & Data input as you type),
and Conversion history (last 10 conversions, saved locally, with a Clear
button). None of these needed a Rust change — pure JS/CSS — so no crates
were added and the next build should be fast, possibly just a window
reload rather than a full recompile.

## Batch 2b (new — needs a real recompile)

- **Image → Base64**: pick one image, get its Base64 string, copy plain or as a `data:` URI.
- **Image Resizer**: batch resize to a target width/height, with a "maintain aspect ratio" toggle (fit within the box vs. stretch exactly).
- **Image Compressor**: batch compress via JPEG quality (1–100); always outputs `.jpg` regardless of input format, since quality-based size tradeoff is specifically a JPEG thing — PNG is lossless and won't meaningfully shrink the same way. Shows before/after size per file.
- **YAML support**: JSON ↔ YAML added to the Text & Data dropdown, via the `serde_yaml` crate (new dependency — this is the one that actually adds compile time this round).

## What's implemented

- Text ↔ JSON, CSV ↔ JSON, JSON ↔ XML, Text ↔ Base64 (all in Rust, no Node)
- Image conversion: PNG/JPG/WebP/BMP, single or batch
- Zip: extract a .zip, or bundle multiple files into one

## About "any 10-year-old PC"

Realistic minimum: Windows 7 SP1 or newer, any dual-core CPU, 2GB+ RAM. The
installer is set to auto-download the WebView2 runtime if the machine doesn't
already have it (older Windows 7/8 machines likely won't) — that step needs
internet access once, during install. After that the app itself is tiny (no
bundled browser) and should idle under ~100MB RAM. I can't literally guarantee
it runs on an arbitrary decade-old machine without testing on one — this is
the realistic floor, not a promise.

## Known risk

The JSON↔XML and XML↔JSON conversion logic is hand-written (no equivalent to
the Node `xml2js` package in this Rust version) and untested — it should work
for straightforward nested data but may behave oddly on unusual XML (attributes
are not currently handled, only elements and text). Flag any bad output and
I'll fix it.
