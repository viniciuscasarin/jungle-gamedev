# Pirate Battle

React + PixiJS + strict TypeScript implementation of [GDD.md](GDD.md). The current
increment provides accessible menu and saved Options, complete local matches, reliable Result Outbox pattern with TanStack Query and Axios, interactive paginated Ranking and Match History tabs with WAI-ARIA accessibility and AbortSignal cancellation, pause, replay and Last Result alongside desktop and multitouch sailing, a responsive HUD, overhead health bars, cannons, autonomous enemies and seeded spawns.

## Public Deployment and Live Demo

The official production release of Pirate Battle is deployed on Netlify:
- **Production URL**: [https://jungle-gamedev.netlify.app](https://jungle-gamedev.netlify.app)
- **Deployment Platform**: Netlify (Automated continuous deployment linked to GitHub `main` branch)
- **Routing & SPA Fallback**: Configured via `netlify.toml` (`/* -> /index.html 200`)
- **Security & Cache Headers**: Hardened HTTP headers with global HTTPS security and dedicated `Service-Worker-Allowed: /` directives

### Client-Side Architecture & Browser Isolation Notice

> **Important Notice on Mock Service Worker & Data Storage**:
> Pirate Battle is engineered as an autonomous, offline-first client-side web application. The REST API endpoints (`/api/ranking`, `/api/matches`, `/api/players/:id/matches`) are intercepted in the browser by **Mock Service Worker (MSW)** and persisted to Web Storage (`localStorage`).
>
> - **No Central Backend**: The application runs entirely within the client environment without contacting external proprietary databases or remote servers.
> - **Per-Browser Local Sandbox**: Leaderboards, match histories, and outbox queues are stored locally within the browser profile of each visitor.
> - **Isolated Sessions**: Matches completed on one device or incognito tab are isolated and will not appear on other devices or browser profiles.

## Run and verify

Reference environment: Windows, Node 26.11.1, npm 11.20.0. Dependencies and lockfile
are pinned. Run `npm ci`, then `npm run dev` and open Vite's loopback URL.

| Command | Purpose |
| --- | --- |
| npm run dev | Development server on 127.0.0.1:5173 |
| npm run lint | Code and core boundary checks |
| npm run typecheck | Strict app/tests and DOM-free core checks |
| npm test | Vitest unit/integration rules |
| npm run build | Typecheck and production build |
| npm run preview | Serve build on 127.0.0.1:4173 |
| npm run e2e | Real Chromium controls against dev and preview |

### Windows PowerShell Execution & ExecutionPolicy Notice

On Windows systems, PowerShell frequently enforces a restricted script execution policy (`Restricted` or `AllSigned`), causing script-wrapped launchers like `npm.ps1` to fail with:
```text
PSSecurityException: File ... npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

To execute all development, build, and test commands reliably in PowerShell:
- **Direct Command Invocation (Recommended)**: Invoke the Windows command wrapper `npm.cmd` explicitly instead of PowerShell wrappers:
  ```powershell
  npm.cmd ci
  npm.cmd run dev
  npm.cmd run lint
  npm.cmd run typecheck
  npm.cmd test
  npm.cmd run build
  npm.cmd run preview
  ```
- **Process-Level Policy Bypass (Alternative)**: Relax the execution policy solely for the current terminal session without requiring administrator rights or affecting system-wide policies:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
- **Verification of Help and Environment**:
  ```powershell
  npm.cmd --help
  npm.cmd --version
  ```


Run build before E2E. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to an existing compatible
binary or install Chromium with `npx playwright install chromium`. Tests start both
servers and reuse existing servers; they must serve this checkout. Reports and traces live at
`project/automation-reports/14-validate-game-end-to-end/playwright-report` and
`project/automation-reports/14-validate-game-end-to-end/test-results`.
Visual regression baselines are stored in `tests/e2e/visual-regression.spec.ts-snapshots/`.
Os projetos E2E usam `desktop-chrome` (1280×900, ponteiro primário fine com touch adicional)
e `mobile-chrome` (844×390, coarse). Casos dedicados verificam portrait 390×844 e landscape 568×320.
Open the HTML report using
`npx playwright show-report project/automation-reports/14-validate-game-end-to-end/playwright-report`.
Prior increment evidence is preserved. The GDD Section 14 verification matrix is recorded in
`project/automation-reports/14-validate-game-end-to-end/verify.md`.

## Controls and recovery

Na abertura, uma cobertura preta estática aparece antes dos módulos/mocks. O logo
Jungle Gaming acompanha a preparação das imagens DOM, texturas e transferência dos
sons usados. A porcentagem representa recursos preparados, não bytes. O menu só
aparece quando os recursos visuais e o bootstrap concluem; não há espera mínima.
Cada recurso tem limite de 30 segundos. Falha visual mantém a tela preta e Retry
reaproveita sucessos sem refresh. Áudio indisponível termina silenciosamente; sua
reprodução exige gesto e respeita mute. Voltar ao menu reaproveita a preparação.

Para reproduzir espera, desabilite o cache nas ferramentas do navegador e limite a
rede; observe a barra e as frases a cada três segundos. Para reproduzir recuperação,
bloqueie a requisição de `ui_scene_background` (ou `ship_5`/`logo_jungle_gaming`) no
painel Network antes de abrir a página; remova o bloqueio e acione Retry. O teste
`npm run e2e -- tests/e2e/startup.spec.ts` intercepta esses recursos em dev e preview,
controla o relógio para as frases e salva capturas inicial/parcial/erro em
`project/automation-reports/startup-landscape/`. Execute build antes de testar preview.

Choose Play with mouse, touch or Tab/Enter. Loading lasts at least 300ms. Arena
focuses the named Sailing controls region. Move a mouse to steer with finite turn
speed; R toggles forward auto-sail once per press. Holding R does not repeat.
Auto-sail starts Off. The ship can turn while stopped, retains heading before the
first input and retains the last normalized direction when the mouse leaves the host.
Targets within 12 units preserve heading. Touch uses the lower-left joypad: drag outside its inclusive 15% dead zone to steer and sail. Release stops manual motion; R On retains movement toward the last selected heading.

Escape / P, the Pause button, window blur or a hidden document immediately pauses, clears input and turns auto-sail
Off. Returning focus does not resume. Activate the HTML Resume button to restore
game focus, then press R again to move. Main Menu asks “Abandon this match?” during play or pause. Keep Playing returns to Paused; Resume is explicit. Abandon creates no result and returns focus to Play. Main Menu also
works during Loading. Retry recovers failed assets or graphics initialization.

`?assetScenario=fail-once` makes the next Play fail even with a warm cache; Retry
uses the normal loader. Refresh rearms the scenario; remove the query to disable.
A câmera acompanha o navio e preenche a tela com cenário sob o HUD; safe areas são aplicadas uma vez. 960×540 define a escala uniforme, sem limitar o mapa. Desktop permite portrait e landscape; mobile exige landscape, inclusive
em 568×320. DPR altera somente o buffer gráfico.

Mobile é definido pelo ponteiro **primário coarse**, independentemente de largura,
user-agent, suporte adicional a toque ou modalidade atual de input. Em portrait
(incluindo viewport quadrado), a proteção opaca prevalece sobre menu, Options,
diálogos e Result. Carregamento e Retry continuam disponíveis nessa proteção.
`Enter landscape` tenta a API de orientação após gesto; fullscreen só é tentado
como alternativa quando o bloqueio direto falha e a API existe. Ausência ou recusa
não impede girar fisicamente o aparelho. Sair de fullscreen não provoca novas
solicitações automáticas; o viewport efetivo sempre decide o acesso.

Entrar em portrait pausa a partida, solta capturas/comandos, desliga auto-sail e
suspende loops sonoros. Retornar a landscape conserva matchId, mundo, tempo e
cooldowns em Paused; Resume explícito é obrigatório e atualiza o enquadramento
antes de aceitar input. Preparação gráfica que termina em portrait monta a partida
já pausada, sem avançar um passo. Options conserva o rascunho durante rotações.
`tests/e2e/orientation.spec.ts` verifica esses caminhos em dev/preview; a emulação
das APIs não comprova bloqueio físico universal em navegadores ou dispositivos.

## Geometry and diagnostics

Open `/?geometry=1` then Play. Pink outlines show actual configured solid shores,
cyan shows the circular hull, white its heading and amarelo mostra a câmera e cinza a fronteira informativa da região.
Drive into each shoreline frontally or diagonally: contact stops inward motion and
permits tangential sliding without damage. Circle radius 18 is independent of visual
sails. The artistic shoreline tolerance 4 units does not allow physical penetration.

`window.__arenaDiagnostics()` returns deeply frozen detached inspection data: live
applications/resources/resize subscription/input listener counts, cache leases and
current navigation snapshot and sources.direction. It has no gameplay setters. Step, activeTimeMs,
position, heading, health, state and auto-sail come from the real simulation. Host
`data-viewport`, `data-player`, `data-ticker-started` expose presentation coordinates.
Expect 1 app/resource / resize group/cache lease, 13 input listeners and 1 owned RAF while
playing; paused has 0 RAF; menu has 0 consumers/listeners/RAF/canvas with warm textures.
Pixi ticker remains stopped. React only updates discrete status changes.

## Scope and source of truth

`src/domain/config.ts` owns immutable ocean-v1/archipelago-v1/balance-v1 data. Setup captures config
and separate uint32 seed. Fixed steps use 1000/60ms and at most 5 per frame, discarding
excess whole backlog while retaining the fraction. Time counts executed steps only.
See [ARCHITECTURE.md](ARCHITECTURE.md) for modules, numerical tolerances, collision,
input and ownership; [ASSET_CREDITS.md](ASSET_CREDITS.md) records art provenance.

The mock REST API, MSW, Axios client and persistent confirmed store are implemented; reliable Result Outbox pattern, and interactive paginated Ranking and Match History UI tabs are fully implemented. Balance values are GDD proposals, not measured playtest results.
Headless Chromium evidence is not a physical-device performance benchmark.



## Player combat demonstration

Hold Q (front), W (port/left) and E (starboard/right) to fire independently while
steering and sailing with R. Weapons start Ready. The semantic HUD shows each weapon's independent Ready/cooldown, seconds and fill. Desktop QWER sits above bottom-center health; touch health is at the top with joypad left and skills right. Score, time and Pause stay at the top. Focus loss clears held
attacks and freezes lifetime/cooldowns; Resume requires fresh key presses.

Open `/?combatScenario=targets` and choose Play for three stationary targets:
Chaser at (480,145), Shooters at (350,270)/(610,270), with health 40/60/60 and real
hull colliders. Hold Q/W/E facing up to destroy all three through normal collisions,
earning one point each. Add `&geometry=1` to inspect the actual heading/colliders.
The query selects an explicit stationary diagnostic mode before creation; it has no
gameplay setters or score grants. Normal access starts without targets. Reentering
restores the selected initial preparation and never carries score or bullets over.
`__arenaDiagnostics()` also exposes frozen enemies/projectiles/cooldowns/score and
dynamic sprite count. Normal mode enables autonomous pursuit, enemy fire and the spawn director.


## Enemies and spawn demonstration

Open `/` and Play. The first pale water warning ring starts at 3 active seconds;
a red Chaser appears at 3.6s. A dark Shooter is warned at 6s and appears at 6.6s
when its position stays safe. Chasers pursue around both islands and deal 25 damage
once on contact, self-destructing for zero score. Shooters approach/retreat around
240 units (30-unit hysteresis), stop in the band and fire only within 300 units,
with clear circular-projectile line of sight and actual aim within 10 degrees.
Their first shot requires 1.5 active seconds in range. Kill either with Q/W/E to
earn one point. R allows sailing while firing. Values remain initial GDD proposals.

Switch to another window during a warning ring: all AI, bullets and warning progress
freeze. Return and activate Resume; the remaining active warning time then elapses.
Confirmed Abandon removes all ships, rings and owned resources. Play starts a fresh explicitly seeded
run. Normal mode has no cap or frequency ramp. Canceled unsafe positions wait for
the next regular opportunity. The explicit prompt's 3/6s agenda plus 0.6s warning
produces appearances at 3.6/6.6s; this reconciles the contradictory GDD phrase that
both appear by 6s without shortening the warning or first interval.

`/?combatScenario=island&geometry=1` prepares a normal Shooter at (85,155), behind
the northwest island from the player at (350,155). Observe it navigate out before
firing; no bullets pass through land. `/?combatScenario=empty&geometry=1` is an
explicit stationary empty navigation diagnostic. `targets` retains the earlier
stationary three-target Q/W/E demonstration. All selectors act before creation;
initial entity data without stationary mode still enables normal AI and spawning.
Readonly diagnostics include enemies, projectiles, spawn reservations with active
deadlines, and live sprite/ring counts. Geometry adds each enemy's actual collider.
No diagnostic exposes teleports, health, kills, score or spawning commands.

## Matches, replay and local recovery

The flow is Main Menu → Loading → Playing ↔ Paused → Result. A match ends once
at the captured active-time limit or zero player health; death wins a tie. Result
shows Score, Active time, Time expired / Ship destroyed and the actual local save
status. It adds no survival points. Loading, pause and results consume no active
time. Paused and completed matches own no scheduled simulation frames.

Play Again creates a new match ID, seed, engine and full configuration from current
saved settings. All gameplay, input, cooldowns, steering, auto-sail and random state
start fresh. Retry preserves the logical match preparation. Last Result opens the
last completed local snapshot without mounting an arena. Refresh during combat or
pause abandons that run, preserving the previously completed result.

Storage uses version-1 envelopes `{ "version": 1, "data": ... }` at
`pirate-battle.options.v1`, `pirate-battle.identity.v1` and
`pirate-battle.last-result.v1`. Corrupt settings fall back to defaults with a visible
explanation. Corrupt historical results are rejected, never rebuilt with defaults.
Denied storage never blocks Play. “Saved on this device” appears only after a
successful write; otherwise the result remains available in memory for this visit.
There is no active-match autosave or remote registration in this increment.

To reproduce the timer ending, open Options, set Game session time to 60 and
Enemy spawn time to 3, then Save before Play.

Open `/?combatScenario=empty&seed=123` and Play. Leave it focused for 60 active
seconds, or use the documented Playwright clock tests; the result is Time expired,
score 0, 60.00 s. For Ship destroyed, open `/?seed=0`, Play and remain still without
firing; real Chasers and Shooter projectiles sink the ship. `seed` accepts uint32;
normal Play generates a fresh seed. `?configScenario=custom&geometry=1` prepares a
1200×600 world, player (600,300) and radius 22 before capture to inspect consistent
render/input/physics configuration. Diagnostic selectors are initial preparations,
never health, score, clock or runtime state setters. Remove queries for normal play.

E2E uses isolated browser storage, real controls/collisions, valid 60-second sessions,
manual/native-blur/platform-hidden pause, focus containment, replay, denied storage,
refresh and five mixed completion/replay/abandon cycles in dev and preview. Hidden
is emulated by the document hidden signal; native blur uses a second browser page.
Reports and captures live in increment 07; evidence 01–06 is preserved.

## Options and configuration capture

Open Options from Main Menu. Game session time accepts 60–180 integer seconds;
Enemy spawn time accepts 1–10 seconds in steps of 0.5. Fields retain their text,
including invalid edits, with associated help/errors. Save is disabled until both
values are valid. Enter submits only valid input. Save returns to the menu only
when local storage confirms the write; denied/quota writes keep the draft and
show an error. Try Save again or Cancel. Cancel and Escape discard edits; all
three exits restore focus to Options. Reopening reads the last saved values.
Tab/Shift+Tab navigate native controls; buttons support Enter/Space and touch.

Try Save with 90 and 2.5, refresh and reopen Options. Edit to 180 and 10, Cancel,
and reopen: 90 and 2.5 remain. For corruption recovery, put invalid JSON in
`pirate-battle.options.v1` through devtools and refresh: defaults 120 and 3 are
explained without writing until Save. A successful Save clears that options warning
while identity/Last Result warnings remain independent. Ranking and Match History
are marked unavailable and perform no data queries at this stage.

To demonstrate capture, save 60 and 1.5 through Options, open
`/?combatScenario=empty&seed=123`, then Play. The read-only
`window.__arenaDiagnostics().navigation.setup` shows the full captured configuration
and seed. Changing saved settings externally during play cannot change that run.
After the timer completes, return to Main Menu, Save 90 and 2.5, open Last Result
and choose Play Again: a new match ID uses those saved options while the historical
result keeps 60 and 1.5. Failed Save and Cancel never become replay settings.
Options is available only from Main Menu, outside Loading/Playing/Paused.

`tests/e2e/options.spec.ts` reproduces these flows against dev and preview with
real keyboard/touch events and the real simulation under Playwright's clock.
Its captures include 1280×900, 320×568 and 844×390, errors, storage failures,
focus/button states and missing DOM artwork. The browser is headless Chromium
with touch enabled; these checks do not claim physical-device performance.

## Touch and hybrid controls

Each attack finger remains captured by its original Q/W/E control, even when dragged
outside. Multiple fingers and keyboard can hold the same weapon; releasing one does
not release the others. Only the first joypad finger owns steering. Tap R and release
inside to toggle cruise; cancellation or releasing outside never toggles. Pause,
window blur, hidden tabs, ending or leaving release all contacts and commands.
Resume needs new touches. Buttons retain keyboard labels, names and visible focus.

Initial mode follows the primary coarse pointer. Actual gameplay touch switches to
touch; mouse steering or gameplay keys switch to desktop. Switching modes clears
old input and disables auto-sail without restarting or advancing the match. Screen
resize, rotation and DPR changes only rearrange layout and preserve the logical
command. Mobile exige landscape; portrait congela a partida até retorno e Resume explícito. A câmera preenche o host e acompanha o player, inclusive após resize. All live ships retain horizontal Pixi health bars in addition to
numeric player health. HUD updates use active simulation time, with no extra timer.

Tests use real CDP multi-touch contacts with persistent IDs and native pointer capture
in headless Chromium. They cover independent release, cancellation, native capture
loss, R confirmation, simultaneous attacks, real collision damage/score, exact pause,
mode/resize and five teardown cycles. CSS insets simulate safe areas; these results
are not physical phone, notch or hardware performance measurements.

## Mock REST API and Data Layer (Increment 10)

Increment 10 adds the mock REST API boundary powered by Mock Service Worker (MSW) and Axios:
- **Mock REST Endpoints**:
  - GET /api/ranking?configurationKey=...&page=1&pageSize=10: Returns paginated ranking sorted by score DESC, completedAt ASC, and matchId ASC, strictly filtered by game configuration key.
  - GET /api/players/:playerId/matches?page=1&pageSize=10: Returns paginated match history for a given player sorted by completedAt DESC.
  - POST /api/matches: Persists a completed match result with strict idempotency (200 OK for identical replay, 409 Conflict for divergent payload on identical matchId).
- **Persistent Storage**:
  - Confirmed matches are saved under LocalStorage key pirate-battle.confirmed-matches.v1, isolated from the active session and immediate last-result.v1.
  - Fallback in-memory storage ensures smooth gameplay during quota exhaustion or restricted storage environments.
  - Pre-seeded with 11 deterministic captain fixtures for instant leaderboard comparisons.
- **Resilient Startup**:
  - MSW initializes asynchronously in main.tsx with a 1500ms timeout race. Any failure is safely handled and logged as a warning, guaranteeing that service failures never block gameplay ("Play").

## Network Simulation Scenarios and Diagnostics (Increment 13)

Increment 13 introduces a centralized network scenario orchestrator (`src/mocks/scenarios.ts`) providing 12 regulatory MSW network simulation profiles defined in GDD Section 13:

### Operational Matrix of the 12 Regulatory Network Scenarios

All 12 MSW scenarios defined in GDD Section 13 can be accessed directly through URL parameters, selected via the Main Menu diagnostic panel, or reset via explicit actions:

| Scenario ID | Direct URL Parameter | UI Trigger / Route | Expected Visual & Network Behavior | Reset Procedure |
| --- | --- | --- | --- | --- |
| `default` | `/?networkScenario=default` | Ranking / History tabs | Nominal 200 OK responses with standard 0–50ms latency; displays 11 pre-seeded captain records. | Active by default. |
| `empty` | `/?networkScenario=empty` | Ranking / History tabs | 200 OK with `{ items: [], totalItems: 0 }`; renders accessible empty state notice ("No confirmed matches recorded yet"). | Select `default` or click "Restore Default Scenario". |
| `multi-page` | `/?networkScenario=multi-page` | Ranking / History tabs | 35+ records across 4 pages; interactive pagination controls ("Previous", "Next", "Page X of 4") enabled. | Select `default` or click "Restore Default Scenario". |
| `slow-jitter` | `/?networkScenario=slow-jitter` | Ranking / History tabs | High variable latency (1,500ms–2,500ms); shows loading spinner and `aria-busy="true"` before rendering items. | Select `default` or click "Restore Default Scenario". |
| `out-of-order` | `/?networkScenario=out-of-order` | Switch rapidly between tabs | Alternates fast (150ms) and slow (1,500ms) responses; stale requests are cancelled via `AbortSignal`, preventing race conditions. | Select `default` or click "Restore Default Scenario". |
| `timeout` | `/?networkScenario=timeout` | Ranking / History tabs | Request exceeds 30s client timeout threshold; triggers timeout error notice with manual "Retry" action. | Select `default` or click "Restore Default Scenario". |
| `offline` | `/?networkScenario=offline` | Ranking / History / Post-match | Immediate network transport failure (`HttpResponse.error()`); displays offline alert banner; preserves outbox items locally. | Select `default` or click "Restore Default Scenario". |
| `error-4xx` | `/?networkScenario=error-4xx` | Ranking / History / Post-match | Returns 400 Bad Request; permanently stops automatic outbox retries to prevent infinite retry loops; displays visible validation error. | Select `default` or click "Restore Default Scenario". |
| `error-5xx` | `/?networkScenario=error-5xx` | Ranking / History / Post-match | Returns 500 Internal Server Error; triggers exponential backoff retries (100ms, 200ms) before transitioning to failed status. | Select `default` or click "Restore Default Scenario". |
| `isolated-tab-failure` | `/?networkScenario=isolated-tab-failure` | Compare Ranking vs History | Ranking endpoint fails with 500 error while Match History succeeds with 200 OK, verifying independent tab query error boundaries. | Select `default` or click "Restore Default Scenario". |
| `commit-timeout` | `/?networkScenario=commit-timeout` | Complete a match to POST | Result is committed to server storage, but response drops; outbox retries with same ID and recovers confirmed match without duplicates. | Select `default` or click "Restore Default Scenario". |
| `temporary-outage` | `/?networkScenario=temporary-outage` | Ranking / History tabs | First 2 requests fail with connection drop; 3rd request onward recovers and succeeds with 200 OK. | Transient; resets counter on scenario switch or data reset. |

### How to Reset Network Scenarios and Mock Data

1. **UI Restore Button**: When any non-default scenario is selected, click the **"Restore Default Scenario"** button in the Main Menu Diagnostic panel.
2. **Direct URL Reset**: Navigate to `http://localhost:5173/?networkScenario=default` (or strip the query parameter).
3. **Mock Data Reset Action**: Click the **"Reset Diagnostics"** button in the panel or call `resetMockData()` to restore canonical fixtures, clear volatile outage counters, and invalidate query caches without affecting user options or pending matches.

### Precedence Resolution Hierarchy

The active network scenario is resolved using strict cascading precedence:
1. **URL Parameter** (`?networkScenario=<id>`): Highest priority. Ideal for Playwright E2E tests and reproducible links.
2. **LocalStorage** (`pirate-battle.network-scenario.v1`): Persists user selection made via UI across page reloads.
3. **Window Memory Override** (`window.__pbNetworkScenario`): Runtime override for programmatic tests or developer console inspection.
4. **Default Fallback** (`default`): Active when no override exists or an unknown identifier is provided.

### Diagnostic Panel and Reset Action

- **Main Menu Diagnostic Panel**: An accessible `<details>` panel in the Main Menu provides a `<select>` dropdown with all 12 scenarios, a badge showing the active profile, and contextual descriptions.
- **Restore Default**: When a non-default scenario is active, a "Restore Default Scenario" secondary button appears to quickly reset to nominal operation.
- **Strict Reset Policy (`resetMockData`)**:
  - Restores only the canonical fixtures under `pirate-battle.confirmed-matches.v1`.
  - Resets volatile scenario state (temporary outage counter, commit-timeout tracking, out-of-order counter).
  - Invalidates TanStack Query caches for ranking and history.
  - **Inviolable Data Preservation**: Never touches or deletes user options (`pirate-battle.options.v1`), player identity (`pirate-battle.identity.v1`), last completed result (`pirate-battle.last-result.v1`), pending outbox submissions (`pirate-battle.outbox.v1`), or sound settings (`pirate-battle.sound-muted.v1`).
- **Combat Simulation Decoupling**: Changing network scenarios or triggering mock data reset operates strictly in background and never restarts, interrupts, or alters an active combat session in `<Arena>`.
- **Accessibility & Mobile Containment**: All interactive targets adhere to >= 44 CSS px touch areas, announcements use `role="status"` and `aria-live="polite"`, and layout adapts cleanly without horizontal overflow down to 320 CSS px.

## Induced Fault Reproduction Guide

This guide provides step-by-step procedures to verify the game's fault tolerance mechanisms across assets, local persistence, and background outbox synchronization.

### 1. Induced Asset Loading Failure

- **Objective**: Verify that asset loading failures do not crash the application, leave the user in a recoverable state, and allow a retry without refreshing.
- **Reproduction Steps**:
  1. Open the game with the induced asset failure query parameter:  
     `http://localhost:5173/?assetScenario=fail-once`
  2. Click **"Play"** from the Main Menu.
  3. Observe that asset loading fails gracefully, displaying a clear loading error screen with an explanation and an accessible **"Retry"** button.
  4. Click **"Retry"**.
  5. The asset loader clears the simulated fault and successfully loads all required combat textures into the Pixi arena.
- **Cleanup**: Remove `?assetScenario=fail-once` from the address bar for normal gameplay.

### 2. Intentional LocalStorage Corruption

- **Objective**: Verify that malformed or schema-corrupted browser storage falls back seamlessly to safe defaults and displays visible status messages rather than crashing.
- **Reproduction Steps**:
  1. Open Developer Tools (F12) → **Application** (or **Storage**) → **Local Storage** → `http://localhost:5173`.
  2. Edit or corrupt the user options key `pirate-battle.options.v1` with invalid JSON:  
     ```json
     { "version": 1, "data": { "malformed: true }
     ```
     Alternatively, run in the Developer Console:
     ```javascript
     localStorage.setItem('pirate-battle.options.v1', '{ invalid json syntax');
     ```
  3. Refresh the page and click **"Options"** on the Main Menu.
  4. Notice the visible warning banner informing that saved options were corrupted and automatically reset to safe defaults (Session: 120s, Spawn: 3.0s).
  5. Adjust any value and click **"Save"**: the options key is re-serialized cleanly with valid schema versioning, clearing the warning banner.

### 3. Result Outbox Retries and Network Recovery

- **Objective**: Verify that match results are preserved in the outbox when offline or facing server errors, retried with exponential backoff, and synchronized upon recovery without duplicates.
- **Reproduction Steps**:
  1. Set the network scenario to offline by loading:  
     `http://localhost:5173/?networkScenario=offline`
  2. Set short session duration in Options (60s) or launch `/?combatScenario=empty&seed=123`.
  3. Allow the match to end (or collide into enemies to sink).
  4. When the **Result Screen** appears, observe that local storage confirms the match was saved locally, while the background submission indicates pending/failed delivery.
  5. Inspect Local Storage key `pirate-battle.outbox.v1`: the completed match result is securely persisted in the outbox queue.
  6. Refresh the page or navigate back to the Main Menu: the pending outbox entry survives page reload.
  7. Restore network connectivity by switching to the default scenario:  
     `http://localhost:5173/?networkScenario=default` (or click "Restore Default Scenario").
  8. Click the manual **"Retry"** button on the pending outbox banner (or wait for the automatic dispatcher).
  9. The outbox confirms HTTP 200/201 response, removes the entry from the outbox, and atomically updates both **Ranking** and **Match History** tabs with the new match score.

## Gameplay Tuning, Profiling & Hot-Loop Benchmarks (GDD §15)

In accordance with GDD Section 15, the project features headless simulation benchmarks, E2E telemetry profiling, and hot-loop memory optimizations:

### Profiling and Benchmark Commands

| Command | Target / Scope | Success Criteria |
| --- | --- | --- |
| `npm test tests/simulation-benchmark.test.ts` | 10,800 virtual ticks (180s session) in standard (3.0s) & stress (1.0s) spawns | Average CPU time per tick < 0.8ms (observed ~0.05ms–0.22ms), p95 < 0.45ms |
| `npx playwright test tests/e2e/performance-profile.spec.ts` | E2E frame interval telemetry & 5-cycle match lifecycle memory audit via CDP | Average frame time ~16.6ms (60 FPS), p95 < 20ms, zero leaked listeners/apps, JS heap growth < 5MB across 5 cycles |

### Architectural Optimizations
- **Simulation Hot-Loop Caching**: `createSimulation` advances state internally across ticks without recursive deep clones (`immutableCopy`) or repetitive `Object.freeze` calls, serving cached immutable snapshots lazily on external `inspect()` and `events()` requests.
- **Projectile Object Pooling**: Reusable `projectilePool` in `src/render/pixiPreview.ts` toggles `visible = false` and resets transform/physics properties upon despawn, eliminating allocations in the rendering tick.
- **Battle Effects Object Pooling**: `muzzleFlashPool`, `woodParticlePool`, and `floatingScorePool` in `src/render/battleEffects.ts` eliminate garbage collection thrashing during intense broadside engagements.
- **Canonical Balance Versioning**: Pinned to `balance-v1` in `src/domain/config.ts` and deterministically included in `configurationKey()` derivation.

## Oceano procedural

Navegue além de 0–960/0–540, inclusive em coordenadas negativas. Regiões por seed contêm ilhas compactas, alongadas e largas; revisitas recompõem o terreno. Mundo/câmera não impõem paredes. Mouse seleciona direção relativa ao navio com dead zone lógica inclusiva de 12 unidades. Com R ligado, ponteiro parado conserva direção durante o acompanhamento. Resize/DPR reapresenta sem mudar input ou posição.

geometry=1 e window.__arenaDiagnostics() oferecem posição assinada, região, câmera e contadores de terreno/grafos/sprites, somente leitura. Caches mantêm recursos necessários mais oito ociosos; sair libera recursos da partida. Entidades ocultas continuam combate. Resultados/envios pendentes finitos continuam legíveis sob as chaves originais; novas partidas usam configuração procedural e opções atuais de 60–180s (padrão 120s).

Hipóteses de calibração: região 1280, margens 80, pares designados 160/280/440 com tolerância 1, disco inicial livre 160 e spawns 240–520 do player. Medições, benchmarks e aceitação ficam em project/automation-reports/infinite-world. Não foram acrescentados assets ou dependências.
