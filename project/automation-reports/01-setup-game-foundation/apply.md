# Apply — setup-game-foundation

Status: completed on 2026-10-27. Recovered executor: `/root/i01_apply_recovery`.
Scope: increment 01 only. Ready for independent VERIFY; no sync or archive performed.

## Scope and recovery

Used `.agents/skills/openspec-apply-change/SKILL.md`, `project/automation.md`, the
explore/propose reports, GDD v0.2, OpenSpec configuration, all CLI-resolved change
artifacts, and only the common context/increment 01 from `project/prompts.md`.
No applicable AGENTS.md was found by the earlier phases or repository inventory.
`openspec.cmd list --json` confirmed the nearest repository root, without a store.
The schema is `spec-driven`; apply resumed at 14/18 completed tasks.

The preceding executor had already implemented the foundation and completed clean
installation, lint, typecheck, 48 tests and build. Its handoff reported a transient
Windows EPERM during `npm ci`, followed by a successful retry without bypass flags.
That installation result is inherited evidence; this recovery did not reinstall the
unchanged dependency tree. `npm.cmd ls --depth=0` independently confirmed the pinned
installed tree. The recovery reran quality checks and final builds because the last
renderer scheduler correction postdated the previous production output.

No change to `project/automation-state.json`, user assets, GDD, infrastructure or
main specs was made by this executor. No additional agents, push or deployment.

## Delivered files and decisions

- Toolchain: `package.json`, `package-lock.json`, `vite.config.ts`,
  `tsconfig.json`, `tsconfig.core.json`, `eslint.config.js`, `.gitignore` and
  `index.html`. Direct dependency versions are exact; npm resolves normal peers.
- Core: `src/domain/config.ts`, `immutable.ts`, `result.ts`, and
  `src/simulation/contracts.ts`. Configuration is copied and frozen recursively,
  options have one metadata source, units and versions are explicit, and uint32
  seed belongs to MatchSetup separately. Results materialize supplied data only.
- UI/rendering: `src/main.tsx`, `src/ui/App.tsx`, `styles.css`,
  `src/render/previewOwner.ts` and `pixiPreview.ts`. React Strict Mode owns semantic
  HTML; the static Pixi ocean is decorative. There is no match-start action.
- Tests: `tests/config.test.ts`, `contracts.test.ts`, `previewOwner.test.ts`.
  Owner tests cover initialization success/rejection, late resolution/rejection,
  setup failure, idempotent cleanup and Strict Mode's setup/cleanup/setup sequence.
  Contract tests include negative compile checks, deep mutation and Node imports.
- Delivery documentation: `README.md` and `ARCHITECTURE.md`, in English, describe
  actual scope, commands, units, proposed GDD values and future integration owners.

React/DOM 19.3.1, PixiJS 8.22.0, Vite 8.3.5, plugin-react 6.1.2, TypeScript 5.9.3,
Vitest 5.0.5, ESLint 10.13.0 and typescript-eslint 8.72.1 were retained from the
validated plan. Installed auxiliary versions are pinned in package.json/lockfile.
The reference runtime is Node 26.11.1 / npm 11.20.0; OpenSpec is 1.14.1.

The renderer owns its stage, graphics, private stopped ticker and canvas. Its
decorative event target is detached to stop Pixi's separate interaction ticker.
The per-renderer background GC scheduler is destroyed because this bounded static
scene releases resources at teardown and only renders at startup/resize. Pixi
8.22's implementation accepts a null event target although its declaration omits
null; the local narrow structural assertion documents that discrepancy. There is
no simulated game loop. No shared/external textures are used in this increment.

## Commands and results

Every PowerShell invocation prepended only this process PATH:

```powershell
$env:PATH = 'C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1;' + $env:PATH
```

| Command | Exit code / evidence |
| --- | --- |
| `node --version` | 0; v26.11.1 |
| `npm.cmd --version` | 0; 11.20.0 |
| `openspec.cmd --version` | 0; 1.14.1 |
| `openspec.cmd list --json` | 0; existing nearest root and setup-game-foundation, initially 14/18 |
| `openspec.cmd status --change setup-game-foundation --json` | 0; all four planning artifacts complete, repo-local edit scope |
| `openspec.cmd instructions apply --change setup-game-foundation --json` | 0 on each task update; progress checked at 14, 15, 16, 17 and finally 18/18 |
| `npm.cmd ci` (prior executor handoff) | 0 on retry after transient EPERM; no force/legacy-peer-deps |
| `npm.cmd ls --depth=0` | 0; installed direct versions match package.json |
| `npm.cmd run lint` | 0 in recovery; includes pure-module import/global restrictions |
| `npm.cmd run typecheck` | 0 in recovery; app/tools/tests and separate core without DOM |
| `npm.cmd test` | 0 in recovery; 3 files, 48 tests passed |
| `npm.cmd run build` | 0 in recovery; final renderer source, 11 dist files |
| `npm.cmd run build -- --emptyOutDir` | 0; second clean build, same 11 filenames/hashes |
| PowerShell `Compare-Object` over both manifests, properties path/sha256 | 0; 11 files, zero differences |
| `npm.cmd run dev -- --strictPort` | Ready at 127.0.0.1:5173; intentionally stopped with Ctrl-C after validation (termination exit 1) |
| `npm.cmd run preview -- --strictPort` | Ready at 127.0.0.1:4173; intentionally stopped with Ctrl-C after validation (termination exit 1) |
| `node project/automation-reports/01-setup-game-foundation/inspect-browser.cjs` | First recovery run 1: production dist predated source, retaining one RAF; final run 0 after rebuild |
| `git check-ignore node_modules dist package.json package-lock.json src/domain/config.ts` | 0; only node_modules/dist returned, source and lockfile retained |
| `openspec.cmd validate setup-game-foundation --strict` | 0; change valid |

The earlier sandboxed browser attempt encountered ERR_NETWORK_ACCESS_DENIED on
loopback. The local browser execution was approved with escalated execution; no
automatic approval rejection occurred. Chromium and Playwright came from existing
Codex/browser installations, without installing project Playwright or an E2E suite.

## Build reproducibility

`build-first.json` and `build-second.json` contain every relative output path and
SHA-256 digest, sorted by path. They were regenerated for the final scheduler
correction. Both runs used the same checkout, installed lockfile tree and runtime;
Vite empties dist before building (the second invocation also sets emptyOutDir
explicitly). The comparison excludes filesystem timestamps only.

Reproduce after each clean build with this manifest operation, using a different
output filename for each run:

```powershell
$taskDist = (Resolve-Path dist).Path
$taskManifest = @(Get-ChildItem -LiteralPath $taskDist -File -Recurse | ForEach-Object {
  [pscustomobject]@{
    path = [IO.Path]::GetRelativePath($taskDist, $_.FullName).Replace('\','/')
    sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
  }
} | Sort-Object path)
$taskManifest | ConvertTo-Json | Set-Content build-first.json
# Repeat npm.cmd run build -- --emptyOutDir, then save build-second.json.
$taskFirst = Get-Content build-first.json -Raw | ConvertFrom-Json
$taskSecond = Get-Content build-second.json -Raw | ConvertFrom-Json
$taskDifferences = @(Compare-Object $taskFirst $taskSecond -Property path,sha256)
if ($taskDifferences.Count -ne 0) { throw 'Build output differs.' }
```

## Browser evidence

`inspect-browser.cjs` is a local validation helper, outside the product/test suite.
It uses the already-installed Chromium 156.0.8078.4. Final results are recorded in
`browser-observations.json`; the helper writes screenshots only after assertions.

| Server / viewport | Result |
| --- | --- |
| Dev / 1280×900 | H1 Pirate Battle, ready status, scrollWidth=1280, one hidden canvas, canvas 990×557, zero pending RAF |
| Dev / 320×740 | Readable title/text/status, scrollWidth=320, one hidden canvas, canvas 270×152, zero pending RAF |
| Preview / 1280×900 | Same semantic/renderer checks; scrollWidth=1280, one canvas, zero pending RAF |
| Preview / 320×740 | Same semantic/renderer checks; scrollWidth=320, one canvas, zero pending RAF |

Screenshots: `dev-desktop.png`, `dev-320px.png`, `preview-desktop.png`,
`preview-320px.png` and `preview-graphics-failure-320px.png`. Desktop and narrow
screenshots were visually inspected: no overlap, clipped title or horizontal
scrolling; the ocean graphics are visibly rendered. The accessibility snapshot has
main/heading/description/figure/status; the decorative canvas is excluded. There
are zero buttons, including no fictitious Play control.

The live preview baseline is two ResizeObservers (owner plus Pixi CanvasObserver),
one window resize listener and one canvas. Five extra App mounts under StrictMode
each reached two canvases/four observers/two resize listeners, then returned to
one/two/one after unmount. All mounted/unmounted measurements recorded zero pending
animation callbacks. Earlier late initialization is additionally covered by the
controlled owner tests. Counts cover the instrumented resource classes; they are
not a general browser memory/performance benchmark.

Controlled graphics failure denied every canvas context, including Pixi's Canvas2D
fallback. At 320px, the English failure status and H1 remained available, with zero
canvas nodes and no page errors/unhandled rejection. Preview console was empty.
Dev recorded only Chromium's `GPU stall due to ReadPixels` driver warnings during
capture; no application errors or other unexpected warnings occurred.

## Reconciliation and handoff

| Delta spec / increment criterion | Implementation and evidence |
| --- | --- |
| application-shell: accessible initial/narrow page | English DOM, aria-hidden preview, screenshots, ARIA snapshot and no-overflow assertions |
| application-shell: owner and late teardown | Explicit async owner, cleanup unit paths, five real StrictMode cycles, zero pending RAF |
| application-shell: readable graphics failure | Controlled all-context failure screenshot/status, zero orphan canvas/page errors |
| game-configuration: central/versioned data and derived ranges | config.ts, ARCHITECTURE GDD mapping, defaults/derived-range tests |
| game-configuration: options/seeds/immutability | Bounds, granularity, nonfinite values, uint32 boundaries and nested source/snapshot mutation tests |
| simulation-contracts: pure input/state/events | simultaneous/neutral input, discriminated events, step/active time, Node tests, core no-DOM typecheck/lint |
| simulation-contracts: complete immutable result | Every GDD §12 field, UTC/numeric/seed checks, deep copy tests and negative compile checks |
| simulation-contracts: no premature mechanics | Source/dependency review; no combat, navigation, game loop, HTTP, storage, ranking or final-screen implementation |
| executable toolchain and reproducibility | Successful clean-install handoff, repeated current quality/build checks, exact 11-file manifest equality |

Game input/storage/data remain documented future boundaries without empty services.
Axios, TanStack Query, MSW and project Playwright are absent from installed direct
dependencies. Their later responsibilities and configurationKey semantics are
documented without implementing them. Supplied art was neither used nor modified.
Balance/map values remain proposals; island envelopes are not final colliders.

Tasks 4.1, 5.2, 5.3 and 5.4 are completed by recovery after their evidence was
reconciled. The CLI final apply state is all_done, 18/18. Independent VERIFY must
audit artifacts/code and affected checks before another executor syncs/archives.
No remaining APPLY blocker. Browser coverage is one installed Chromium on this
Windows host; no cross-device/FPS guarantee is claimed. Asset provenance remains a
future release requirement, with no new art introduced here.
