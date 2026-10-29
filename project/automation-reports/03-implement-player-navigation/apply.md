# Apply — implement-player-navigation

Completed on 2026-10-27 by `/root/i03_apply`, ready for independent VERIFY.
Project openspec-apply-change skill; valid local root; spec-driven schema;
18 implementation/verification tasks completed with CLI tracking confirmation.
No main specs, configuration/map, automation-state, prior evidence, dependencies,
sync/archive, push or deploy were changed. Existing untracked increment01/02 work
was preserved. Code, UI and delivery documentation are English.

## Delivered behavior and files

- `src/simulation/engine.ts`: explicit immutable MatchSetup capture, fixed-step
  steering/auto-sail, immutable snapshots and neutral events, explicit freeze/Resume.
- `src/simulation/accumulator.ts`: explicit duration, at most5 steps/frame, discarded
  whole excess and retained fractional remainder; active time is step count times dt.
- `src/simulation/collision.ts`: swept circular hull against actual configured
  segment/vertex shoreline and inset world bounds, tangential projection, eight
  contact iterations and valid-position fallback. No shoreline damage.
- `src/input/desktop.ts`: CSS origin/inverse/clamp, retained logical targets and
  queued R edges; repeat/duplicate suppression and context/shortcut filtering.
- `src/render/navigationLoop.ts`: one explicitly mounted RAF, clean timing baseline,
  immediate freeze cancellation and idempotent disposal. Input clears on ownership
  loss, blur/hidden/destroy; Resume requires new R.
- `pixiPreview.ts`, `previewOwner.ts`, `loadingAttempt.ts`: authoritative presentation,
  stopped private Pixi ticker, mount-only listeners, safe late initialization and
  wrapper Resume propagation. Explicit WebGL2 canvas/context makes unavailable
  graphics fail semantically before invalid fallback rendering. Stencil requested
  to satisfy Pixi context requirements. Detached diagnostics are deeply frozen.
- `App.tsx`, CSS and index: English Arena/mouse/R/Auto-sail/Paused/Resume, named
  focusable game region, keyboard focus restoration, narrow screen controls, favicon.
  React only receives discrete auto-sail/paused changes.
- Tests/docs: navigation rules, ownership integration, real browser paths and resource
  audits. README and ARCHITECTURE describe controls, time, tolerances, geometry and
  scope. Reporter/output moved to increment03; evidence01/02 remains intact.

World arena-v2 and balance-v1 remain unchanged:960x540, radius18, speed150, turn pi,
mouse dead zone12, 1/60s steps and catch-up5. Artistic tolerance4 is independent of
physical epsilon1e-7 and assertion tolerance1e-6. No combat, enemies, touch steering,
full session lifecycle, remote API, persistence or publication was introduced.

## Commands and results

Every execution shell prepended the verified Node26.11.1 directory to process PATH
and used npm.cmd/openspec.cmd. No global nvm switch or dependency installation.

| Command/check | Exit | Evidence/result |
| --- | --- | --- |
| openspec.cmd list/status/instructions apply --change implement-player-navigation --json |0 each| Valid repository; all planning artifacts read; started0/18 |
| npm.cmd run lint |0| Core boundaries and source/tests checked; rerun after final harness edit |
| npm.cmd run typecheck |0| Strict app/tests plus DOM-free core; final build also repeats it |
| npm.cmd test |0|83 tests in9 files; historical run82 before adding wrapper Resume case |
| npm.cmd run build |0| Production build; final stencil revision built/typechecked |
| npm.cmd run e2e |0|14/14 passed in1.3min:7 dev Strict Mode +7 preview |
| npm.cmd run e2e -- --grep 'fits desktop|graphics init' --reporter=list --output=project/automation-reports/03-implement-player-navigation/stencil-smoke-results |0|4/4 dev/preview render/failure/resize/DPR checks after final stencil flag; complete14-case HTML report preserved |
| openspec.cmd validate implement-player-navigation --strict |0| Change valid; no validation warning |
| Exact task source checkbox update followed by apply instructions |0 each| Each completion independently reflected in CLI progress |

Node26.11.1/npm11.20.0/OpenSpec1.14.1; existing Chromium1248 executable:
`C:/Users/Vinicius/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe`.
Build emits a >500kB main-chunk advisory (519.53kB); build succeeds. No measurement
of device performance or human playtest balance is claimed.

## Evidence and observations

Complete report: `playwright-report/index.html`; passing output: `test-results/`.
`browser-evidence/` contains desktop,320,portrait,landscape,DPR2, failure/loading,
paused/Resume and all route/contact PNGs for dev and preview. Visual inspection
confirmed readable320px paused status/Resume/Main Menu and desktop shoreline/hull
alignment, with artistic backgrounds and islands retained.

JSON bodies were extracted from the complete HTML report's embedded ZIP, preserving
actual Playwright attachments as standalone files:

- `report.json`:14-case successful report summary.
- `dev/preview-resource-cycles.json`: five Play/exit cycles each. Mounted1 app,
  resource, resize group, cache lease, canvas and native RAF;7 owned input listeners.
  Native tracked input count16 mounted returns exactly to baseline8 after every exit.
  Every exit has0 apps/resources/input listeners/observers/RAF/cache leases/canvases;
 30 warm textures remain by policy. No growth across cycles.
- `dev/preview-navigation-observations.json`: ten waypoint observations around all
  four sides of both islands, mouse/R only. NW contact(312.3447,151.8867), then
  oblique slide(229.2014,58.8704); SE contact(647.1034,383.2199), then
  slide(737.4721,295.3666). Health100 throughout. R held/repeated stayed On.
- `dev/preview-focus-observations.json`: native blur at step47/time783.3333ms,
  position(510,270), auto-sail Off;30s stopped then focus restoration preserved all
  values. Resume retained position/heading, no backlog, no movement until new R.
  Hidden signal paused at step131/time2183.3333ms, position(540,270), Off; another30s
  unchanged and visible restoration did not resume. Targets survived resize/DPR and
  pointerleave, cleared on freeze/ownership loss. Editable/action/modified input was
  excluded; inspected snapshots reject mutation.
- `dev/preview-viewport-observations.json`: full-world desktop/320/portrait/landscape
  transforms and isolated DPR2, no physical position changes or additional canvas.
- Console issues attachments are empty; final tests had no unexpected JS errors.

Unit coverage includes FPS30/60/120/144 equality, invalid deltas, long stalls/no
backlog, dead zone11.999/12/12.001, shortest arc/tie/wrap, stationary turn, forward
speed, immutable historical snapshots, R queue with zero/multiple steps, every edge
and vertex of both islands, tangency/separation/repeated contacts, huge sweeps,
world corners, constant-health paths, late owners/loading and wrapper Resume.

## Corrections and practical limits

Initial browser launch omitted the existing executable override and failed. A
non-escalated teardown left the first runner/servers waiting; all three verified
checkout-specific node processes were stopped after successful tests, and final
smoke fixtures shut down normally. Elevated execution followed existing workflow
authorization and automatic approval; no denial remains.

Early harness failures were corrected: Playwright clock overrides native RAF audit,
so deterministic clock tests inspect real snapshots and the unclocked cycle test
measures native RAF; paused clock/40ms input edges avoid fractional-frame assertions.
Favicon404 fixed in index. Graphics failure exposed a partial fallback cleanup
exception; explicit context initialization now preserves recoverable Loading failed.
Native listener audit now checks stable mounted counts and exact baseline cleanup,
including renderer's additional platform listener.

Native blur is tested with a real second tab after disabling Playwright's CDP focus
emulation. This Chromium automation environment keeps document.hidden=false even
for background/minimized windows and native lifecycle commands. Hidden handling is
therefore tested with an emulated document.hidden getter and visibilitychange signal,
then restoring the native getter; it never calls a gameplay setter, freeze method or
callback. JSON labels this distinction. Native OS hidden-tab coverage remains a
physical-browser verification limitation, not a claimed observation. Touch steering,
real-device performance and full lifecycle remain future increments.

Reading note: an initial bounded read accidentally included later prompt text. No
future increment was implemented; subsequent reads used section boundaries. The
Purpose sync note is outside APPLY: main specs were not edited and later sync must
follow its skill's Purpose-preservation rules.

## Handoff

Run independent VERIFY against all artifacts, code, tests and these observations.
All18 tasks are complete; no material failing check or implementation blocker
remains. Do not infer archive/sync completion from this report; those are later
phases. Automation state is owned by the orchestrator and was not touched here.
