# Jyotirmaya — Vedic Jyotish, rooted in Odisha

A 100% free, no-account, no-server Vedic astrology (Jyotish) web app: kundli
chart (North or South Indian style), four varga (divisional) charts — also
in North or South Indian style — Shadbala strength, the full Vimshottari
dasha tree, classical yogas, dated transit predictions, life-area
probabilities, and a real, chart-driven, fully offline Cosmic Oracle — all
rendered in a visual language drawn from Odisha's temple art (the Konark Sun
Temple's 24-spoke wheel, the Jagannath palette, Pattachitra border work)
alongside original Navagraha medallions and a Warli-inspired decorative
strip.

No paid API, no API key, no ads, no account, no server required to use it.

## The fastest way to run it

Double-click **`Jyotirmaya-App.html`** in this folder (or `run/index.html` —
they're identical). That's it — it's a single self-contained HTML file with
everything (JS, CSS, fonts fallback) inlined, so it works straight from disk
(`file://`), no install, no server, no internet required for anything,
including the Cosmic Oracle (an internet connection only improves the
display font, via Google Fonts — entirely optional).

> Saved profiles use your browser's `localStorage`. This works when opening the file directly in Chrome, Edge, and Firefox. If your
> browser restricts storage for local files (some strict configurations do),
> the app still works fully in that session — it just won't remember saved
> profiles after you close the tab. For guaranteed persistence on every
> browser, serve the folder instead of double-clicking it:
> ```
> cd run
> npx serve .
> # or: python3 -m http.server 8080
> ```
> then open the printed `http://localhost:...` address.

## Running from source (for development / customization)

```bash
npm install
npm run dev       # dev server with hot reload
npm run build     # produces run/index.html — a fresh single-file build
npm run lint      # oxlint
```

## What's real vs. what's decorative

Every number in this app — planet positions, house placements, dasha
periods, yoga detections, transit dates, shadbala scores, life-area
probabilities, and guidance decisions — comes from the calculation engines
in `src/engines/`. The core astronomy (`chart-engine/`: sidereal positions,
Vimshottari dasha, varga division, shadbala) is untouched. The
`prediction-engine/` files have received a number of small, disclosed fixes
on top of the original logic over several sessions (see "Changes in this
build" below) — not new astrology, just completing what the code already
declared it was doing or wiring up data structures (like `DOMAIN_MAP`) that
existed but were never actually used. The only other new code is UI, state
management, routing, and the adapter functions in `src/lib/adapters.js` that
reshape one engine's output into the next engine's expected input
(documented inline).

### Cosmic Oracle

The Guidance page was simplified down to just this — the "Guidance & Alerts"
header, "Per-domain decisions," and "Scored dasha × transit windows" sections
that used to live above it have been removed (the data behind them is still
computed and still feeds the Oracle itself; only their standalone display is
gone). The Oracle now gives one long-form (9-section) reading, composed
entirely from **this profile's own computed chart**: current dasha down to
the Pratyantardasha, Moon placement with nakshatra/pada and lunar
Tithi/Paksha, every classical yoga detected (not just the headline one), the
next three upcoming transits, all five tracked life-area scores, Shadbala's
strongest/weakest planet, a risk composite explained in plain language, and
focused guidance for whichever domain currently has the least support — the
exact same numbers shown on the Probabilities page (see
`src/engines/ai-offline-engine/oracleContext.js` and `offlineOracle.js`).
Nothing about it is generic or random; "Draw another" only rotates
*phrasing*, never the underlying facts.

**Fully offline, unconditionally.** An earlier build had an optional "Live
Oracle" toggle that sent a chart-fact summary to a free text-AI endpoint to
re-phrase this same data. That code path (`aiOracleConnector.js`) has been
removed entirely — there is now no network call anywhere in the Oracle,
under any setting. It works offline because it always did the real
computation on-device; the AI layer only ever touched prose, never numbers.

## Two calculation tracks

- **Track A (default, always on):** pure JavaScript, runs entirely in the
  browser, Lahiri ayanamsha, Meeus-series planetary positions (~1 arcminute
  accuracy). Powers every screen.
- **Track B (optional "Precision Mode"):** a local Python + Swiss Ephemeris
  backend (`server/astro-python-backend/`) for higher precision. It does not
  compute Vimshottari Dasha, so per the engine's own contract, Kundli, Dasha,
  Yogas, and Transits always use Track A; turning Precision Mode on only
  upgrades the planetary positions fed into the Life-Area Probability engine.
  To run it locally:
  ```bash
  cd server/astro-python-backend
  pip install flask flask-cors pyswisseph --break-system-packages
  python app.py
  ```
  Then enable "Precision Mode" in Settings (default backend URL:
  `http://localhost:3001`). If the backend isn't running, the app detects
  this, tells you, and keeps working on Track A — it never fails silently.

## Geocoding & timezones — also offline, also free

Birthplace search uses a bundled offline city list (`src/lib/cities.js`,
~210 places worldwide, weighted toward Odisha and India) — no geocoding API,
no key, no rate limit. The UTC offset for a birth date is derived from
latitude/longitude via `tz-lookup` (an offline IANA timezone dataset) plus
the browser's own `Intl` timezone database, which correctly accounts for
historical DST-rule changes rather than using a single fixed offset.

## Privacy

Saved birth profiles and app settings are stored only in `localStorage` on
this device — there is no account, no server, no cross-device sync, and (as
of this build) no network call anywhere in the app's core reading
experience, including the Cosmic Oracle. Precision Mode is the one optional
exception: if you turn it on, your birth data is sent to a Swiss-Ephemeris
backend — but that's a backend *you* run yourself, off by default, and
disclosed in Settings.

## Changes in this build

- **Cosmic Oracle rewritten** to use real chart data instead of 4 random
  generic paragraphs and fabricated scores (`oracleContext.js`,
  `offlineOracle.js`, `aiOracleConnector.js`).
- **Optional free Live Oracle AI** — no paid key, off by default, graceful
  fallback (see above).
- **North Indian / South Indian diamond-and-square chart diagrams added to
  the Divisional Charts (Varga) page** — it previously showed only a plain
  sign-grouped list and ignored the app's own chart-style setting entirely.
- **Bug fix (yoga engine):** the Dhana Yoga block's own comment said
  "2nd/11th lords," and the 11th house lord's placement was already being
  computed, but the matching check for it was missing — the 11th-lord half
  of this yoga was never actually detected. Added.
- **Bug fix (adaptive learning):** `PERSONALIZATION_ENGINE`'s accuracy
  profile reads from `OUTCOME_TRACKER`, but nothing in the UI ever called
  `recordOutcome()` — so every user's accuracy score was permanently stuck
  at the 0.5 default. Guidance feedback (👍/👎) now also records an outcome,
  since it's the only real-world signal this app collects about whether a
  reading landed.
- **Dead code removed** (lint-flagged, no behavior change): a handful of
  unused variables/functions in the prediction engines. Core astronomy in
  `chart-engine/` was left untouched by design — see "What's real vs.
  decorative" above.
- **Renamed** Surya → Jyotirmaya, across the UI in all three languages.
- **About the Developer** section added to Settings.
- **Original artwork added:** a Navagraha medallion frieze (Dashboard,
  Planets page) built from this app's own existing geometric planet-emblem
  system, and a Warli-folk-art-style decorative border (Settings). Both are
  original line art generated in-app, not a trace, crop, or recolour of any
  existing painting, photo, or product image — see the comments in
  `NavagrahaFrieze.jsx` / `WarliBorder.jsx` for why.

### This session

- **Guidance page simplified to just the Cosmic Oracle** — removed the
  "Guidance & Alerts" header/alerts list, "Per-domain decisions" grid, and
  "Scored dasha × transit windows" list. The nav item is renamed Guidance →
  Oracle (Moon icon), across all three languages. The underlying
  `guidance.decisions/windows/alerts` data is untouched and still computed —
  the Oracle itself still reads from it — only the standalone display of it
  on this page is gone. `FeedbackButtons.jsx` was removed as dead code since
  its only caller (the decisions grid) no longer exists.
- **Live Oracle removed entirely.** The optional "send a chart summary to a
  free text-AI to re-phrase it" toggle and its connector
  (`aiOracleConnector.js`) are gone — not just turned off. The Oracle now has
  no network code path under any setting; see the rewritten Oracle section
  above.
- **Cosmic Oracle rewritten as a long-form, 9-section reading:** ruling
  dasha (down to Pratyantardasha) → Moon placement + nakshatra + lunar
  Tithi/Paksha (newly computed; this Panchanga element wasn't surfaced
  anywhere before) → every classical yoga detected, not just the headline
  one → the next three upcoming transits, not just the nearest → all five
  tracked life-area scores, not just the top/bottom two → Shadbala's
  strongest/weakest planet → a risk composite explained in plain language →
  focused guidance for the weakest domain → a closing classical remedy.
  Typically 450-600 words, entirely reconstructed from real chart data on
  every read.
- **Bug fix (yoga engine, Raja Yoga):** the previous check treated "a planet
  physically sitting in a kendra house (1/4/7/10) conjunct with a planet
  sitting in a trikona house (1/5/9)" as the trigger condition. Since kendra
  ∩ trikona = {house 1} only, that reduced to "any two planets conjunct in
  the 1st house," regardless of whether either planet actually *ruled* a
  kendra or trikona house — not the classical definition, and both over- and
  under-detecting real Raja Yoga. Rewrote to find the actual lords of the
  kendra and trikona houses (from Lagna) and check for conjunction or mutual
  graha drishti (planetary aspect) between them.
- **Bug fix (decision engine, per-domain scoring):** `evaluateAllDomains()`
  stamped every one of career/marriage/finance/health with the exact same
  pre-computed `topScore` — so all four domains always showed an identical
  score and level, and `DOMAIN_MAP` (which houses/planets actually govern
  each domain) was defined but never once used anywhere in the codebase.
  Added `scorePeriodForDomain()`, which weights the dasha lord, transits,
  yogas, and Shadbala by whether they actually touch that domain's own
  houses/planets — the four domains now genuinely diverge. Also added a
  `spirituality` entry to `DOMAIN_MAP`/`MESSAGES` so all five domains the
  Probabilities page tracks have a matching decision (previously
  spirituality had none, so the Oracle's "focus on your weakest area"
  guidance silently disappeared whenever spirituality was weakest).
- **Bug fix (transits, real "now" vs. birth-time position):**
  `transitPredictionEngine.js` took the transiting planet's *natal*
  (birth-moment) longitude and used it as the starting point for "today,"
  then projected forward from `Date.now()` — i.e. it silently assumed
  today's sky matches the sky at birth. Correct only if someone was born
  today; for any older chart this put every dated transit prediction off by
  however many years had passed (Jupiter alone drifts ~30°/year). Fixed by
  calling the same accurate `calcKundli()` a second time, for today's date,
  and feeding those real positions in as the starting point.
- **Bug fix (probability engine, same root cause):**
  `probabilityPredictionEngine.js`'s "transits" object was built from the
  chart's own *natal* planet houses — the code comment even said so ("we use
  the chart's own planet positions as transits approximation") — instead of
  real current transiting-planet houses. Fixed the same way, computing real
  "now" positions and passing each graha's actual current house (from natal
  Lagna) in.
- **Bug fix (data plumbing):** `shadbalaToArray()` dropped the planet's name
  from every entry, so nothing downstream could tell *whose* strength a
  given number belonged to — which is exactly what the new per-domain
  scoring above needs. Now retains `name` on each entry (additive; existing
  `.total`/`.pct` fields are untouched).
- **Accuracy fix (Oracle scores):** `favorable_period_days` used to report
  the matched window's fixed width, which `decisionAdaptiveEngine.js` always
  builds as exactly ±5 days — so this number was structurally stuck at `10`
  on every chart that had any favorable window at all. Now reports days
  remaining until that window actually begins.
- **Palette & UI:** a `.starfield` hero (layered indigo gradient + a slow
  twinkling star field, stilled under `prefers-reduced-motion`) now opens the
  Oracle page; every `PageHeader` across the app got a small gold-to-marigold
  accent underline; added a reusable `--shadow-glow-gold` token and deepened
  the existing night-texture gradient. No existing color tokens were changed
  — all additive.

### Previous session

- **Bug fix (Shadbala):** `EXALT_SID` — the table of exaltation *points*
  used to score each planet's Sthana Bala — stored only the degree-in-sign
  for 5 of 7 planets (e.g. Mars: `28` instead of `298`), missing the sign's
  30° offset entirely. Sun and Moon happened to be correct by coincidence,
  which is what let it hide. Mars/Mercury/Jupiter/Venus/Saturn's positional
  strength was being scored against a point sitting in Aries instead of
  their real classical exaltation degree. Fixed; verified against a sample
  chart (Mars's Sthana Bala moved from ~39 to the correct ~51).
- **Bug fix (transits):** `transitPredictionEngine.js` declares a
  `{transit:'Jupiter', natal:'Ascendant'}` watch pair, but the Ascendant was
  never actually included in the planet array passed to it — only the 9
  grahas are. That pair silently produced zero predictions on every chart,
  forever. Fixed in `adapters.js` by adding a synthetic Ascendant point.
- **Bug fix (probability engine):** `yogaCancelled()`'s "combust AND
  retrograde" condition checked `p.retro`, but every planet object it's
  actually called with uses the field name `retrograde` — so that half of
  the check could never fire, on any chart, ever. Fixed.
- **Accuracy add (dignity):** Neecha Bhanga (debilitation-cancellation)
  detection added to `calcDignity()` — a debilitated planet whose sign
  lord sits in a Kendra from Lagna or Moon is now labelled "Neecha Bhanga"
  instead of plain "Debilitated," with a tooltip explaining why. Simplified
  to the single most commonly cited classical rule; other cancellation
  routes (mutual exchange, exalted dispositor) aren't modeled.
- **Accuracy fix (yoga engine):** Viparita Raja Yoga was flagging any 2+
  ordinary planets simply sitting in houses 6/8/12 — not the actual rule.
  Now checks whether the *lords* of the 6th/8th/12th houses are placed in
  a *different* dusthana house, with the three classical sub-yogas named
  (Harsha/Sarala/Vimala).
- **Accuracy add (probability engine):** `planetStrength()`'s "Shadbala-lite"
  model rewarded exaltation/own-sign but had no debilitation penalty at
  all — a debilitated planet scored identically to a neutral one. Added.
- Rahu/Ketu exaltation points corrected to be genuinely opposite each other
  (Taurus/Scorpio) instead of the previous same-value placeholder.
- **Palette:** two additive accent tokens, `--color-leaf` and
  `--color-marigold`, pulled from the Pattachitra reference palette
  (foliage green, flame-orange) — used in the new Navagraha frame accents
  without touching the existing UI-chrome colors.
- **NavagrahaFrieze redesigned:** each graha now sits in its own outer
  frame silhouette (flame-circle, pointed oval, arch, triangle, diamond,
  bow, banner) echoing classical Navagraha panels' per-deity framing,
  instead of one identical circle for all nine.
- **WarliBorder redesigned:** added the hand-holding circle-dance (the
  genre's single most recognisable motif, previously missing) and a small
  bird-pair accent, alternating with the original row-of-dancers group.
- Dead code removed (2 more lint-flagged unused declarations in
  `suryaChartPacket.js`).

## Project layout

```
src/engines/chart-engine/       sidereal positions, dasha, varga, shadbala — untouched core astronomy
src/engines/prediction-engine/  yogas, transits, probabilities, adaptive guidance (two disclosed fixes, see above)
src/engines/ai-offline-engine/  Cosmic Oracle: fully offline, long-form chart-driven narrative (no AI/network layer)
src/lib/                        adapters, offline city/timezone data, storage, i18n
src/context/                    React state: settings, saved profiles, computed chart
src/components/                 chart wheel (north/south), layout, common UI, guidance widgets, original art
src/pages/                      the 11 screens
server/astro-python-backend/    optional Track B backend (run separately)
run/                            the double-click-ready single-file build
```
