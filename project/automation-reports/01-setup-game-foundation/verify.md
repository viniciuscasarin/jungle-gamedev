# Verification Report: setup-game-foundation

Date: 2026-10-27. Phase: independent VERIFY, increment 01.

**Decision: ready for synchronization and archive.** All applicable checks passed;
there are no critical issues, warnings, suggestions or unverified checks. This phase
does not synchronize specs, archive the change or advance the automation state.

## Scope and method

Used the `openspec-verify-change` workflow and the explicit correction authorization
in `project/automation.md`. Read the automation state without editing it, the common
context and increment 01 of `project/prompts.md` only, GDD v0.2, OpenSpec configuration,
all four planning artifact groups and the APPLY report/evidence. The CLI resolved
the existing repo-local root and concrete artifact paths under
`openspec/changes/setup-game-foundation`; no store is configured.

Reviewed every file in `src/`, all three test files, tool configurations, package
manifest/lockfile, README and ARCHITECTURE. Checked actual code and test assertions
against the requirements rather than accepting the completed task checkboxes.
No applicable AGENTS.md was found. No product or planning changes were necessary.
Only this verification report was added.

## Summary

| Dimension | Status |
| --- | --- |
| Completeness | 18/18 tasks supported by code, documentation and execution evidence; 11/11 ADDED requirements implemented |
| Correctness | 11/11 requirement mappings and 20/20 scenarios covered by code, automated checks or actual browser evidence |
| Coherence | Design decisions followed; dependency direction, naming, units, resource ownership and scope consistent |

There are no MODIFIED, REMOVED or RENAMED requirements in these delta specs.
All six workflow checks ran: Task Completion, Spec Coverage, Requirement
Implementation Mapping, Scenario Coverage, Design Adherence and Code Pattern
Consistency. No check is
marked clean merely because its artifact exists.

## Requirement and scenario mapping

Paths below are relative to the repository root. Line numbers refer to the reviewed
source, which this phase did not modify.

| Requirement | Implementation | Scenario evidence |
| --- | --- | --- |
| Tela inicial mínima acessível | `src/ui/App.tsx:24`, `src/ui/App.tsx:34`, `src/ui/styles.css:4`, `index.html:2` | Primeiro acesso / Visualização estreita: semantic main, heading, English text and polite status; hidden decorative canvas; dev and preview desktop/320px observations and all four screenshots inspected |
| Recursos de renderização com dono explícito | `src/render/previewOwner.ts:13`, `src/render/pixiPreview.ts:6`, `src/ui/App.tsx:9` | Montagem repetida: owner tests and five real dev App cycles under StrictMode return to the resource baseline. Inicialização tardia: controlled unresolved-promise tests destroy the obsolete resource without mounting, subscribing or setting state |
| Falha de renderização legível | `src/render/previewOwner.ts:31`, `src/render/pixiPreview.ts:50`, `src/ui/App.tsx:29` | Renderer indisponível: initialization rejection tests plus actual preview browser with all canvas contexts denied; English failure status, retained heading, zero canvas nodes and zero page errors |
| Valores iniciais centralizados e versionados | `src/domain/config.ts:5`, `src/domain/config.ts:19`, `src/domain/config.ts:67` | Configuração padrão / Alcance derivado: `tests/config.test.ts:5` checks versions, complete initial values, radian conversions and computed 504/360/390-unit ranges; compared against GDD §§4–8/13 and design table |
| Validação das opções de partida | `src/domain/config.ts:56` | Limites válidos: lower/upper limits and valid intermediate increments in `tests/config.test.ts:26`. Valores inválidos: both options reject nonfinite, out-of-range and off-step values before returning a config, at `tests/config.test.ts:31` |
| Snapshot profundamente imutável | `src/domain/immutable.ts:2`, `src/domain/immutable.ts:7`, `src/domain/config.ts:52` | Edição posterior da origem / Mutação pelo consumidor: `tests/config.test.ts:35` edits source options, weapons, island envelopes and arrays, then checks detached unchanged snapshots and runtime write rejection. Negative compile checks cover nested writes and collection mutation in `tests/contracts.test.ts:62` |
| Seed independente da configuração | `src/domain/config.ts:71`, `src/domain/config.ts:75` | Duas seeds para a mesma configuração / Seed inválida: boundary seeds 0 and 4294967295 preserve equal configs without seed fields; negative, fractional, oversized and nonfinite seeds reject in `tests/config.test.ts:50` and `:58` |
| Entrada normalizada por passo | `src/simulation/contracts.ts:4`, `src/simulation/contracts.ts:11`, `src/simulation/contracts.ts:19` | Comandos simultâneos / Entrada neutra: `tests/contracts.test.ts:10` represents direction, world target, simultaneous held fire, movement and separate toggle/pause edges; neutral input has no invented target |
| Estado e eventos independentes da apresentação | `src/simulation/contracts.ts:21`, `src/simulation/contracts.ts:36`, `src/simulation/contracts.ts:48` | Consumidor sem navegador / Eventos discriminados: Node tests build serializable snapshots and all four event variants with explicit step/active time; core typecheck excludes DOM and lint restricts platform imports, clocks and ambient randomness |
| Resultado completo imutável | `src/domain/result.ts:7`, `src/domain/result.ts:23`, `src/domain/result.ts:33` | Construção de resultado de referência: all eleven GDD §12 fields preserved, nested input detached, runtime mutations rejected and numeric/UTC/seed invariants tested in `tests/contracts.test.ts:35`–`:59`. Campos ausentes ou alteração de resultado: negative compiler checks at `:62` reject incomplete results and nested writes |
| Contratos sem execução antecipada de mecânicas | `src/domain/config.ts`, `src/domain/result.ts`, `src/simulation/contracts.ts` | Importação isolada: all core imports execute in Node tests; source review finds data construction and pure validation only, without game loop, gameplay, HTTP, storage, generated IDs/timestamps or real match finalization |

## Task and design reconciliation

| Tasks | Evidence checked |
| --- | --- |
| 1.1–1.3 | Exact direct versions, packageManager and engines in package.json; lockfile present; installed dependency tree valid; strict TS, scripts and English setup instructions agree; only node_modules/dist ignored among the sampled source/lock paths |
| 2.1–2.4 | Single option metadata source; all design/GDD initial values and units represented; computed projectile ranges; config copy/freeze and separate uint32 seed; architecture preserves proposal authority and nonfinal island envelopes |
| 3.1–3.4 | Plain readonly input/snapshot/event contracts and complete immutable supplied result; no platform dependencies in core; input/storage/data reserved in documentation without speculative services; future Axios/Query/MSW/Playwright owners and configurationKey inclusions/exclusions documented |
| 4.1–4.3 | Actual React StrictMode entry and semantic responsive shell; explicit async owner and detached initializer; render setup/rejection/late-disposal tests; English docs accurately describe static preview and resource ownership |
| 5.1–5.4 | Recorded clean npm ci and builds from APPLY; current dependency/quality checks pass independently; both recorded build manifests and current dist agree; real browser evidence inspected; scope checked against all delta specs and increment criteria |

React owns DOM and Pixi owns rendering. The core has no reverse imports to either.
The configuration contains gameplay data, with visual choices remaining in the
render/UI owners. No final menu, combat, movement, API, persistence, mock backend,
RNG or fixed-step engine has been added. Future integrations are described without
installing their project dependencies. The supplied art is unchanged and unused.

The renderer's private ticker is stopped. Its decorative event target is detached,
and its bounded static scene destroys the background scheduler. Inspected the
explicit ownership/destruction and partial-initialization paths; repeated real
mount/unmount observations support the cleanup behavior. The narrow structural
assertion for Pixi's nullable event target is localized and explained. This phase
did not alter renderer code, so the existing graphical evidence remains applicable.

## Commands and exit codes

Every shell used the process-only runtime prefix from `project/automation.md`:

```powershell
$env:PATH = 'C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1;' + $env:PATH
```

| Verification | Result |
| --- | --- |
| `openspec.cmd list --json` | Existing nearest root; selected setup-game-foundation with 18/18 complete tasks |
| `openspec.cmd status --change setup-game-foundation --json` | All planning artifacts complete, spec-driven schema, repo-local scope |
| `openspec.cmd instructions apply --change setup-game-foundation --json` | all_done; tracking configured, 18 complete / 0 remaining; all concrete context files readable |
| `npm.cmd run lint` | Exit 0 |
| `npm.cmd run typecheck` | Exit 0; application/tools/tests plus separate core without DOM |
| `npm.cmd test` | Exit 0; 3 files, 48 tests passed, 4.77-second reported duration |
| `npm.cmd ls --depth=0` | Exit 0; direct installed versions agree with package.json, no missing/invalid dependency reported |
| PowerShell package-lock.json direct dependency/version comparison | Exit 0 using ConvertFrom-Json -AsHashtable; root declarations and all direct resolved versions agree with package.json, lockfile v3 |
| `openspec.cmd validate setup-game-foundation --strict` | Exit 0; change valid |
| PowerShell Compare-Object, first vs second build manifests, properties path/sha256 | Exit 0; 11/11 files, zero differences |
| Same comparison, second manifest vs SHA-256 of every current dist file | Exit 0; 11/11 files, zero differences |
| `git check-ignore node_modules dist package.json package-lock.json src/domain/config.ts` | Exit 0; only node_modules and dist returned |
| Final Node process inventory | Exit 0; zero active Node processes |

The three initial CLI reads ran in a combined read-only shell whose final `rg`
search returned 1 because no AGENTS.md matched; their complete success JSON is the
evidence for those reads. The later independent strict validation exited 0.
No command bypassed dependency or OpenSpec validation.
An initial supplementary lockfile check exited 1 because PowerShell's default
ConvertFrom-Json cannot represent npm's empty root-package key. Repeating that
read-only check with -AsHashtable passed; this was a verification-script parsing
error, not a lockfile/dependency defect, and required no repository correction.

## Existing build and browser evidence audited

APPLY recorded successful `npm ci`, quality checks and two clean builds. VERIFY
did not repeat installation, builds or browser sessions because product/tooling
code was unchanged and the concrete artifacts were available. Recomputed hashes
of all current dist files rather than relying on the report's equality claim.
The final renderer source timestamp is 17:13:19 UTC; final dist/index.html is
17:19:01 UTC; second manifest is 17:19:02 UTC; browser observations are 17:19:40
UTC. These support the recorded rebuild-before-browser ordering.

Read `inspect-browser.cjs` and `browser-observations.json`, and visually opened
all five PNG screenshots. The helper starts actual installed Chromium, navigates
both local servers, waits for the real ready status and saves screenshots after
resource/layout assertions. Its only forced graphics substitution is the separate
negative test denying all canvas contexts; successful screenshots use real Pixi.

- Dev and preview at 1280px and 320px: readable title/description/status, visibly
  rendered water marks, no overlapping text or horizontal scrolling, one hidden
  canvas, no fake gameplay buttons and zero pending animation callbacks.
- Five extra dev App cycles under StrictMode: mounted counts 2 canvases / 4
  ResizeObservers / 2 window resize listeners; after each unmount, the original
  page baseline is restored to 1 / 2 / 1, with zero pending animation callbacks.
- Controlled preview graphics failure at 320px: readable failure status and title,
  zero canvas nodes and no page errors. The failure record does not contain an RAF
  measurement; no failure-specific zero-RAF claim is made here.
- Preview console is empty. Dev warnings are Chromium ReadPixels GPU driver
  warnings during capture; the helper rejects other warnings/errors.

The browser evidence is for one installed Chromium on this Windows host and the
instrumented resource classes. It does not establish cross-device performance,
general heap behavior or gameplay readiness. Those are outside this foundation's
scope, rather than skipped applicable checks. Asset provenance remains a future
delivery concern because no supplied or external art was introduced here.

## Findings and handoff

- CRITICAL: none.
- WARNING: none.
- SUGGESTION: none.
- Corrections: none required.

**All checks passed. Ready for archive.** The archive executor may now synchronize
the three delta specs and archive setup-game-foundation under the previously
authorized workflow, after its own CLI/root/task checks. No sync, archive, state
edit, next increment, push or deployment occurred during VERIFY.
