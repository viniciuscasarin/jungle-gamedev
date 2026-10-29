# Pirate Battle architecture

## Current scope and authority

The current increment implements a semantic menu, validated saved Options, recoverable loading, responsive HUD, multitouch and desktop
navigation, player combat, autonomous enemies and seeded spawn warnings in a composed arena. Pure TypeScript simulation owns fixed-step steering,
auto-sail, cannons, continuous projectile/hull collision, AI, spawns, damage and score. React
owns screens and discrete status; PixiJS presents authoritative snapshots. Blur or a
hidden document freezes simulation until explicit Resume. Session lifecycle, local Last Result, persistent mock REST API, reliable client outbox with TanStack Query, and interactive paginated Ranking and Match History UI tabs are fully implemented. GDD v0.2 is the product authority.

Numerical balance remains an initial proposal, not a playtest result.
`src/domain/config.ts` is the single typed source of gameplay data. The map is
**arena-v2** (solid shoreline replacing arena-v1 envelopes); balance is **balance-v1**.
Asset paths and visual layout belong to adapters, never to the core.

## Toolchain and boundaries

Reference runtime: Node 26.11.1 / npm 11.20.0. React/DOM 19.3.1, PixiJS 8.22.0,
Vite 8.3.5, plugin-react 6.1.2, TypeScript 5.9.3, Vitest 5.0.5, ESLint 10.13.0,
typescript-eslint 8.72.1 and Playwright 1.64.1 are pinned with a lockfile. Normal npm ci
uses peer resolution without bypass flags. Typecheck covers sources, unit/E2E tests
and Vite/Playwright config; a second core config omits DOM libraries. ESLint forbids
platform imports, clocks and ambient randomness in domain/simulation.

| Location | Owner and allowed dependencies |
| --- | --- |
| src/domain | Serializable configuration, immutable copying, setup/result materialization; pure TypeScript |
| src/simulation | Deterministic engine, accumulator, hull collision and input/snapshot/event contracts; may depend on domain |
| src/render | Asset manifest/cache, viewport, navigation RAF, Pixi adapter, subscriptions and async owner; may consume core data |
| src/audio | Web Audio engine, sound catalog, voice-stealing polyphony, threshold sentinels, mute persistence and silent fallback |
| src/ui | React screens, semantic status and layout; consumes render adapters |
| src/input | Composed keyboard, mouse and captured multitouch adapters producing logical StepInput |
| src/storage | Defensive versioned identity/settings, last completed result, and outbox store key |
| src/data | HTTP contracts, typed Axios client, pagination, REST error envelopes, TanStack Query client, and outbox delivery service |
| src/mocks | Mock Service Worker handlers, browser worker, Node test server and confirmed matches store |
| src/api | Convenience aliases re-exporting client contracts, store and identity services |

Reserved boundaries are documented without empty speculative services. Current flow:
input → StepInput → simulation → readonly snapshots to Pixi; discrete navigation
status to React. React/Pixi cannot decide damage, score or termination.
No global bus, singleton engine or renderer import exists in the core.

## Units and initial configuration

World x points right, y down; zero heading points right, positive angles clockwise.
GDD degrees convert once to radians. Logical units are independent of CSS/DPR.
Clock values use Ms, speeds UnitsPerSecond and turn speeds RadiansPerSecond.

| GDD source | Central initial data |
| --- | --- |
| §8 options | Session 120000ms, range 60000–180000, step 1000; spawn 3000ms, range 1000–10000, step 500 |
| §5 map |960×540; player(480,270), heading−π/2; island origins(135,95)/(665,325),160×120 each |
| §6 player/chaser/shooter | Health 100/40/60; speed 150/115/90; turn equivalent 180/140/110°/s; hull radius 18/16/18 |
| §6 contact | Player 0; Chaser 25 once before destruction; Shooter 0 |
| §6 front | Damage 20,1 projectile,350ms cooldown,420units/s,1200ms life |
| §6 port/starboard | Each damage 20,3 projectiles,1200ms cooldown,360units/s,1000ms life, longitudinal spacing 14 |
| §6 shooter cannon | Damage 10,1 projectile,1500ms cooldown,260units/s,1500ms life |
| §6–7 readiness | Player initially ready; Shooter first shot waits one full cooldown in range |
| §7 shooter | Range 300, preferred distance 240, hysteresis 30; aim tolerance 10° |
| §7 spawn | Minimum player distance 240, telegraph 600ms; alternating Chaser/Shooter starting Chaser; no initial cap; first full interval; no backlog |
| §4 controls | Mouse dead zone 12; joypad dead zone 0.15; auto-sail starts off |
| §6 rules | Damage protection 0; player enemy destruction+1; contact self-destruction 0; friendly fire/piercing/splash/shoreline damage/projectile collisions off |
| §13 timing | Fixed step 1000/60ms, catch-up bound 5 |

Projectile range derives from speed×lifetime/1000:504/360/390 for front/broadside/
Shooter. OPTION_METADATA owns creation validation and future form limits/labels.
Creation rejects nonfinite, out-of-range and off-step values. Snapshots copy plain
objects/arrays and freeze the detached copy, never the caller's data. MatchSetup
captures config and a separate supplied uint32 seed 0…4294967295. The caller supplies the seed; the director owns its private seeded RNG. No global clock
or random source is used. Visual colors, device breakpoints and accessibility/network preferences
remain outside gameplay config. Gameplay changes update the appropriate version.

## Contracts and results

StepInput distinguishes no steering, world target and normalized direction; movement,
three held-fire flags, auto-sail edge and pause edge coexist. SimulationSnapshot
contains step index, active time, state, score, player/enemies/projectiles, cooldowns
and auto-sail. SimulationEvent discriminates damage, destruction, score and end with
explicit step/time and scalar payloads. Data contains no sprites or browser events.
The core imports/runs in Vitest Node without DOM.

CompletedMatchResult includes matchId, playerId, playerName, completedAt UTC, integer
score, activeDurationMs, endReason, full configuration, configurationKey and seed.
materializeCompletedResult validates numeric/calendar UTC/seed invariants, copies
and freezes supplied data. It does not finalize a match, generate IDs, read clocks,
register data or read storage. The session completion boundary derives the canonical gameplay key. Negative compile checks enforce full readonly contracts.
configurationKey canonicalizes all gameplay-affecting data and map/balance
versions, excluding seed, identity, screen size and accessibility/audio preferences.

## Asset cache and renderer ownership

assetManifest.ts maps measured individual PNGs through Vite URLs, recording physical/
logical dimensions and original ship orientation. Atlas UI layout remains logical 1×;
retina names do not decide density. ASSET_CREDITS.md records mapping, transformations
and repository/challenge provenance with author/license not documented. Samples do
not become scene textures.

sessionAssets owns Pixi textures. createAssetCache accepts a load/unload backend;
acquire() returns an idempotent lease with ready/release(). Concurrent leases share
the pending promise. All loads settle before a failed batch rejects; valid partial
textures stay warm, only missing/rejected assets retry. Rejection clears pending
work and releases failed leases. Zero leases keeps successful textures warm between
Main Menu visits. The cache owns unload, not the renderer.

closeSessionAssets() delegates to idempotent close(): block new acquisitions, wait
for all leases and pending loads, then unload every retained texture exactly once.
Unload failures are reported after all unloads settle. The cache module registers
HMR/pagehide closure. On real non-BFCache pagehide the React root unmounts and releases
owners; BFCache preserves the live session. HMR also unmounts the root when its entry
module is replaced. Closure waits for late initializers that still borrow textures.
Tests cover late loads, late graphics init and a surviving concurrent lease.

Every mounted arena has createLoadingAttempt and createPreviewOwner. Effect cleanup
invalidates that generation, cancels/resolves the minimum 300ms delay and disconnects
subscriptions. It releases its lease immediately unless graphics init/resource still
borrows it; that lease remains until the late resource is destroyed. The owner never
attaches obsolete resources. Destroy is idempotent, callbacks after disposal are
ignored and Retry creates a new keyed generation. Failure releases participation
and preserves semantic Retry/Main Menu. The scenario flag is checked before acquire,
so failure stays demonstrable with warm textures.

An initialized resource is detached until its current owner mounts it. It owns its
Application, stage, display objects, stopped private ticker and canvas. Destruction
uses removeView/children=true and texture/textureSource=false, preserving borrowed
textures. Init failure without renderer destroys only the allocated stage; failure
after renderer creation destroys the whole app. Owner tests cover mount/resize/
observe failures and Strict Mode setup/cleanup/setup.

Pixi's event target is disconnected, its per-renderer scheduler destroyed and the
private app ticker stopped. This scene needs no periodic GC scheduler
or interaction ticker. A mounted resource owns one navigation RAF; presentation also refreshes on resize/DPR.

observeArenaResize installs one ResizeObserver, one window resize listener and a
rearmable `(resolution: <DPR>dppx)` query. Cleanup removes all three, including partial
registration failure. A density notification rearms against the new DPR; the renderer
resizes its buffer without rebuilding scene/textures. Read-only window.__arenaDiagnostics()
exposes live application/resource/subscription/cache counts. Host data attributes
show transform/player/ticker state. E2E also instruments actual native observers,
listeners and RAF; it does not rely only on internal counters. No inspection method
mutates gameplay.

## Arena composition and measured geometry

World 960×540. Water uses TilingSprite tile 73 with tile scale 40/64. The two islands
compose independent Sprite tiles: rows 6/7/8/9,22/23/24/25,54/55/56/57. Cell dimensions
derive from configured island 160×120 divided by 4 columns/3 rows, yielding 40×40.
Alternative interior 38..41 is cataloged only. Rock 49, foliage 70 and palm 72 decorate
land without expanding solid geometry. Player ship 5 is centered at(480,270), anchor
(0.5,0.5), uniform scale 0.5 (33×56.5), rotation `headingRadians - π/2`; initial−π/2
points the original downward sprite up. Chaser 3/Shooter 8 are rendered for live diagnostic entities at the same uniform scale.

world.islands stores id, origin, dimensions and one local convex solidOutline each.
NW=(135,95), SE=(665,325). Vertices are clockwise in screen coordinates (x right/y
down), without duplicating the closing vertex; last edge closes to first. Translation
adds island origin. Config arrays and individual vertices are deeply frozen. The
160×120 envelope is placement metadata, not a rectangular collision solid. Center
and water routes remain clear. The simulation consumes this same polygon.

The 65 local vertices shared by each island are listed below. They are measured in
logical units, independent of screen resolution.

```text
(0,64.375)  (0.625,28.125)  (1.25,23.75)  (1.875,21.25)  (2.5,19.375)
(4.375,15.625)  (5.625,13.75)  (7.5,11.875)  (9.375,10.625)  (14.375,8.125)
(17.5,6.875)  (22.5,5)  (24.375,4.375)  (28.75,3.125)  (33.75,1.875)
(40,0.625)  (44.375,0)  (95,0)  (130.625,0.625)  (135.625,1.25)
(138.125,1.875)  (140,2.5)  (143.75,4.375)  (146.25,6.25)  (147.5,7.5)
(148.75,9.375)  (150.625,13.125)  (152.5,17.5)  (155.625,26.875)  (156.875,31.25)
(157.5,33.75)  (158.75,40)  (159.375,44.375)  (159.375,55)  (158.75,90.625)
(158.125,95)  (157.5,97.5)  (156.25,101.25)  (155,103.75)  (153.75,105.625)
(151.875,107.5)  (150,108.75)  (146.25,110.625)  (141.875,112.5)  (130.625,116.25)
(125.625,117.5)  (119.375,118.75)  (115.625,119.375)  (63.75,119.375)  (28.125,118.75)
(24.375,118.125)  (21.875,117.5)  (18.125,116.25)  (15.625,115)  (13.75,113.75)
(11.875,111.875)  (10.625,110)  (8.125,105)  (6.875,101.875)  (5,96.875)
(4.375,95)  (3.125,90.625)  (1.875,85.625)  (0.625,79.375)  (0,75)
```

Source composition 256×192 pixels converts at 0.625units/pixel. The report measurement
script selects warm sand by RGB(r≥150,g≥100,r>1.04g,g>1.25b), excluding transparent
pixels. Outer row/column silhouettes exclude interior grass; it does not infer solid
land from alpha bounds or decoration. Water fails the sand-color predicate. The convex
outline conservatively approximates the antialiased edge and tiny wavy variations.
There are 768 comparison samples. Maximum sand-boundary-to-segment error is 1.875 units;
reverse outline-to-sand sampling (21 points per edge) is 1.901 units. Both are below
**4 logical units**. Rounded corners are preserved.

shoreline-measurements.json, shoreline-overlay.png and reproducible Pillow script
measure-shoreline.py are in
`project/automation-reports/02-integrate-assets-and-arena-renderer/`. Run that script
from the repo root to compare current config with source art; it asserts both error bounds.
`?geometry=1` draws the same configured vertices in pink over the real browser scene.
The hull solver uses these same solids; decorations do not add obstacles.

## CSS viewport and safe areas

fitViewport is pure and knows neither DOM nor Pixi/DPR. Screen means CSS pixels local
to host top-left. Given host width/height and left/right/top/bottom reserved insets:

```text
W = hostWidth - left - right; H = hostHeight - top - bottom
s = min(W/worldWidth, H/worldHeight)
ox = left + (W - worldWidth*s)/2; oy = top + (H - worldHeight*s)/2
worldToScreen(x,y) = (ox+x*s, oy+y*s)
screenToWorld(x,y) = ((x-ox)/s, (y-oy)/s)
```

Runtime insets come from measured top/bottom HUD border boxes, including safe areas exactly once. viewport-fit=cover opts into safe-area layout. The pure fit helper retains legacy default insets for callers without HUD measurement; the live renderer always supplies measured insets. Extra space becomes letterbox. Nonpositive/nonfinite host or usable
area returns renderable:false; no division by zero is consumed, and later resize can
restore rendering. The inverse does not clamp letterbox points. The pointer adapter subtracts host bounding-client coordinates and clamps the result to the world.

Renderer resolution/autoDensity control the backing buffer: CSS size×DPR. They do not
enter s/ox/oy or mutate logical coordinates. Tests roundtrip corners/center/outside
points within 1e−8. Browser checks desktop 1280×900,320×568,390×844,844×390, DPR 2 and an
isolated density change with CSS dimensions held constant.

## Verification and remaining integrations

Vitest covers immutable config/results, pure contracts, sand geometry, transforms,
cache/retry/final disposal, owner races/failures, loading attempts and subscription
cleanup. ESLint and a second DOM-free TypeScript config protect core purity. Playwright
support covers the current menu/loading/arena flow against dev (Strict
Mode effects) and preview. Five real navigation cycles prove no live-resource growth;
other tests exercise invalid PNG recovery, graphics failure, pending-load cancellation,
warm cache, resize and density. Reports include screenshots and failure traces.

CDP metrics emulation changes devicePixelRatio before invalidating CSS media queries.
E2E toggles native Emulation media to flush that notification without invoking app
callbacks or dispatching a synthetic resize. Raw CDP screenshots preserve the temporary
DPR override; Playwright page.screenshot would restore context metrics. Unit tests
independently verify native query rearming and cleanup.

Axios, TanStack Query and MSW keep their future transport/remote-state/mock roles.
Remote persistence/outbox, ranking and publication
remain future work. Local Chromium evidence proves navigation and
resource behavior; it is not a physical-device performance benchmark.


## Navigation runtime and input ownership

createSimulation explicitly captures MatchSetup and exposes deeply frozen snapshots
and events. Imports start no effects. Steps use fixedStepMs/1000 and activeTimeMs is
step index times fixedStepMs. Target steering, held Q/W/E and the auto-sail edge execute;
pausePressed freezes before another active step; direction steering and movementRequested provide manual touch sailing through the same finite turn and collision rules.
Normal access begins empty and enables AI/spawning; explicit stationary diagnostic targets use real damage and score. Authoritative match completion stops the engine at the terminal step. Angles wrap to (-pi,pi], with
positive rotation on exact half-turn ties. Distance <= configured dead zone retains
heading. Turn precedes forward movement; R Off still allows turning.

createAccumulator accepts explicit nonnegative finite milliseconds. At most five
whole steps execute per frame; excess whole steps are discarded and fractional
remainder retained. TIME_EPSILON_MS=1e-8 handles floating step boundaries. First RAF
and first RAF after Resume establish a baseline only. The mounted owner starts one
RAF, with Pixi ticker and renderer scheduler stopped. Freeze cancels it immediately,
clears input and timing, turns auto-sail Off and publishes paused without advancing.
Only HTML Resume restarts with a clean baseline. Destroy cancels and removes every
owned listener idempotently; loadingAttempt and previewOwner forward Resume safely.

The host is a named, focusable region; canvas is decorative. Mouse focuses the host
and stores a CSS inverse-transformed, clamped logical target. Pointerleave retains
it; resize/DPR do not reinterpret it. Zero-area transforms ignore new targets.
Q/W/E/R/Escape/P are accepted in the focused sailing region or its skill controls while playing.
Ctrl/Alt/Meta/Shift shortcuts, editable fields and interface controls retain normal
behavior. Repeats/duplicate downs are ignored until keyup; queued pressure edges
survive frames without steps and are consumed one per step, not one per RAF.
Leaving input ownership clears held keys, edges and target. Window blur and hidden
also freeze. Restoring focus alone cannot resume. Resume restores focus and requires
new R to move. React receives discrete status and visible cooldown tenths, never steps.

## Continuous hull collision

The visual ship is 33x56.5; its circular collider has radius18. Visual sails and the
160x120 island placement envelopes do not define solids. The 65-vertex shoreline is
the solid, not the art envelope; artistic tolerance4 is unrelated to physics.

collision.ts sweeps a moving circle against every translated segment face and vertex
circle, plus world bounds inset by hull radius. It selects earliest contact with
stable configuration/feature ordering, backs off CONTACT_EPSILON=1e-7 units and
projects remaining inward velocity out of the contact normal. Up to eight contacts
are solved per move; exhausted movement is discarded at the last valid position.
Tangential or separating t=0 contacts are ignored. Assertions use
PENETRATION_TOLERANCE=1e-6 units. hullIsValid checks actual segments and polygon
interior. Rotation leaves the circle unchanged. Scenario contacts emit no damage.
Tests cover every segment/vertex of both islands, repeated/tangential/separating
contacts, large sweeps, bounds/corners and authoritative paths with health100.

geometry=1 adds inset center bounds (yellow), hull (cyan) and actual heading (white)
to the pink shorelines. __arenaDiagnostics returns a detached deeply frozen copy of
resource/cache counts and navigation snapshot/target, without mutation methods.
One current snapshot feeds Pixi; no interpolation or gameplay setters are exposed.



## Player weapons, continuous projectiles and atomic damage

`combat.ts` captures optional `InitialCombatData` once, checking unique nonempty IDs,
finite numbers, archetype health/maxHealth, positive projectile life/speed/damage/radius,
faction/provenance consistency and solid-world validity. Caller data is detached and
frozen. Overlap between ships may be prepared to exercise contact. The player remains
the configured start. No runtime setters exist. The URL adapter selects only the
`targets`, `empty` or normal `island` initial preparation; normal initialization has empty enemy/projectile arrays.

Screen-space heading theta has front F=(cos(theta),sin(theta)), port P=(sin(theta),
-cos(theta)) and starboard S=-P. Navigation updates the actual heading/position before
emission. Q uses F. W/E use parallel P/S velocities from longitudinal positions
s=-14,0,+14 along F. Technical assumptions in `config.projectiles` are radius 5 and
muzzle clearance 0.5 logical units, independent of PNG resolution. Let D=hull radius
+ projectile radius + clearance=23.5. Broadside lateral distance is sqrt(D^2-s^2);
Q distance is D. Every center is D from the hull center. The full segment from the
longitudinal emission point to the muzzle and final circle occupancy are checked
against solids/bounds, ignoring the owner. Blocked individual balls are consumed;
the weapon still takes its full cooldown, and valid members of the volley survive.

The first eligible step fires immediately. A shot emitted at active time t sets its
own deadline t+350ms (Q) or t+1200ms (W/E). Held input fires on the first step whose
active time reaches that deadline within 1e-7ms floating tolerance. It never accumulates
wall-time backlog. Published cooldown is max(0,deadline-active time). New projectiles
are visible at emission, with full lifetime, and first move on the following step.

Each active step creates new events, then: (1) resolves existing projectiles in stable
lexicographic ID order with deaths applied immediately; (2) navigates a living player;
(3) resolves living Chaser contact against the living player, 25 damage and
self-destruction with zero score; (4) emits requested ready weapons for a living player;
(5) publishes frozen snapshot/events. Shooter hulls cause no contact damage. Player
health zero disables steering/sailing/fire/contact and completes after the existing-ball phase.
Existing projectiles retain provenance after their owner dies, through the terminal step only.

Each projectile captures ownerId, faction, damage, speed, heading, radius and remaining
life. Event sourceId always identifies its emitting ship, not the projectile ID. Enemy
fire targets only the player; player fire targets only living enemies. Allies never
consume a ball and balls do not collide with each other. Effective travel time is
min(fixed step,remaining life), including a hit at the final valid instant. No later
travel occurs. The circle sweep checks the same convex shore faces and rounded vertex
circles as navigation and radius-inset world bounds, with no slide. It selects global
minimum normalized TOI across solids and hostile hull circles. Initial overlap is t=0.
A 1e-7 TOI comparison tolerance gives solid priority on ties, then lexicographic ship ID;
solid feature ties have the same consume-only outcome. Occupancy assertions retain
1e-6 unit tolerance. Navigation's separate slide response is unchanged.

First valid hit consumes a ball and applies damage once, clamping health to zero.
Only positive-to-zero emits destruction. Dead enemies are immediately removed so later
balls cannot hit corpses. Only a player-owned projectile kill adds exactly one point
and one score event, regardless of archetype. Contact destruction adds zero. Events
belong only to their step; historical snapshots/events remain detached and frozen.

The existing owner/RAF presents snapshots. Enemy/projectile sprites reconcile by ID,
destroying removed display objects with texture/textureSource false; the session cache
owns borrowed textures. Q/W/E have independent held flags, R retains edge behavior;
keyup, host blur, freeze and teardown clear ownership. Repeats cannot restore cleared
held input. React publication compares semantic status keys: cooldown changes only
when its displayed tenth changes, plus immediate Ready/score/auto-sail/paused transitions.
Cooldown text is outside aria-live to avoid repeated announcements. No per-frame
React subscription or extra ticker is added.


## Enemy navigation and tactical phases

`navigation.ts` caches a deterministic graph by serialized world geometry, hull
radius plus clearance, and grid spacing. Nodes are spaced 20 units; each diagonal
and orthogonal edge is a circular swept segment. Graph data contains no run state.
A* uses stable node order and tie breaks. Each actual endpoint connects to up to 12
nearest visible nodes; a destination invalid for the enemy radius selects a nearby
reachable region. Direct routes are preferred. Smoothing and endpoint connections
are checked again using the authoritative circular sweep/slide solver, requiring
the complete requested endpoint to be reached (1e-6-unit comparison). This also
permits a valid coast-touching hull to move tangent/away instead of rejecting every
segment at t=0. A 0.05-unit graph clearance avoids choosing shoreline-touch nodes.
No shortcut may cross a solid, including when skipping a reached waypoint.

Private behavior state holds a route, destination, 250ms replan cadence and Shooter
hold/approach/retreat mode. Destination movement over one grid spacing also replans.
Chaser targets the current player position. Shooter enters approach above 270 or
retreat below 210, retaining correction until 240; otherwise holds and turns toward
the current player. Blocked routes take precedence over distance holding. Tactical
holding requires a hull-width clear corridor to prevent oscillation at shoreline
corners; shooting itself checks the configured projectile radius. Retreat chooses a
valid lateral destination if the ideal away point is on land. Forward advance is
bounded by configured speed and positive alignment cosine; heading has configured
angular speed. There is no reverse or predictive aiming.

Each step resolves existing balls and deaths first; then the living player's and
surviving enemies' swept moves/contact; deterministic enemy separation; player and
eligible Shooter emission; due reservations and scheduled opportunities; immutable
publication. New bullets and newly spawned ships act from the next step. Dead
entities cannot act, contact or emit later. Player death blocks AI and director and
clears pending warnings while existing projectiles retain their provenance.

`constrainHull` sweeps against other hulls, backs off 0.05 units and projects remaining
motion tangentially, then revalidates scenario movement. Contact Chaser-player is
resolved before a separation correction. Shooters cause no contact damage. Local
repulsion influences enemy intent near other enemies; authoritative hull barriers
remain mandatory. Repairs move enemies only, never the player. Coincident/group
preparations use stable ID order and a finite radial search (24 rings, 16 directions)
for a scenario-safe position free of all other hulls. A blocked player stops instead
of being pushed into a shore or beyond a world edge. These technical tolerances and
limits are centralized in `configuration.navigation`, independent of GDD balance.

Shooter deadlines start at first in-range evaluation with activeTime+1500ms; leaving
300 clears the deadline. LOS or aim obstruction within range preserves a ready
cooldown. Emission requires current player alive, distance <=300, circular projectile
LOS and actual heading error <=10 degrees, with 1e-7 numerical tolerances. The shared
`emitWeapon` checks hull-to-muzzle traversal and captures owner/faction/damage/speed/
lifetime; no duplicate impact implementation exists. Only a successfully emitted
ball resets its active deadline; a blocked muzzle preserves the ready cooldown.
Freeze executes no steps, preserving every private deadline.

## Seeded director and warning ownership

`director.ts` uses Mulberry32 with explicit uint32 addition/bitwise arithmetic;
seed zero is valid. Every attempted perimeter sample consumes one draw, rejected
samples included; no global Math.random is read. Each opportunity tries up to 64
candidates, stopping at the first valid one. Inset is hull radius plus twice the
0.05-unit clearance. The continuous rectangular perimeter uses one uniform scalar.
Candidate validation checks full hull against scenery/world, >=240 player distance,
all live hulls and other reservations, and a connected route for its own radius.

The absolute opportunity deadline starts at one configured interval and advances by
whole intervals, discarding missed slots. It never queues replacement work, imposes
a live cap or changes frequency. Reservations contain unique ID, archetype, position,
creation and materialization active times. At +600ms all safety checks run again,
excluding that reservation. Unsafe positions cancel with no immediate replacement.
Only successful materialization advances Chaser/Shooter alternation. Private ID
allocation checks all initial/projectile/reservation/ship IDs; IDs are never reused.
RNG is private to each simulation; historical snapshots/reservations are detached,
deeply frozen data. Explicit stationary mode disables AI/director independently of
whether initial entities are present. Normal is the default.

Default opportunities at 3/6s plus the mandatory 600ms warning produce ships at
3.6/6.6s when safe. This follows prompt05's explicit algorithm and records the GDD
section7 conflict with 'both by 6s'; no first interval or warning is shortened.
Discarded accumulator wall time does not advance active agenda or RNG. Pauses do
not process reservations and Resume resets the wall-clock baseline. Completed state
also executes no steps. Session/result UI consumes the terminal facts described below.

Pixi reconciles Graphics warning rings by reservation ID using snapshot active time,
removing them on cancellation/materialization and destroying them with owned stage
objects on teardown. Ring progress freezes with the snapshot. Ship and projectile
sprites still borrow textures from the session cache. The read-only diagnostic adds
reservation data and ring counts; geometry adds enemy colliders. URL initializers
select targets/empty stationary or island normal data before the loop is created;
there are no runtime mutation or success commands. Browser evidence for this change
is isolated under increment05, preserving increment01–04 reports and screenshots.

## Session preparation, terminal step and recovery

`domain/session.ts` captures `SessionPreparation { matchId, identity, setup }` with
`MatchSetup { configuration, seed }` deeply detached before Loading. The UI boundary
supplies crypto IDs, seed and completion UTC date; the core never reads clocks,
storage, DOM or ambient randomness. URL diagnostic data/configuration is prepared
before this capture. Retry replaces only the loading generation; replay captures
current validated stored options into a new engine and identity for the match.
The persistent captain identity is independent of each match ID.

State transitions are Menu → Loading → Playing ↔ Paused → Result. Loading failure
stays recoverable. Main Menu in Playing pauses before opening confirmation. Keep
Playing returns to Paused and focuses Resume; Abandon discards without result.
Resume clears input and temporal baseline again; React restores arena focus after removing its inert flag. Semantic
modal dialogs contain Tab focus and exclude gameplay hotkeys. Result focuses its
title; menu returns focus to Play. Status publishes integer remaining seconds,
health, score, state and cooldown tenths only when displayed values change. Cooldowns
and the timer are outside live regions; pause/result use discrete polite status.

Each final step resolves **all existing projectiles**, including valid player kills
after the projectile that killed the player. This preserves the lethal-step score-2
regression. A projectile-killed player does not move/contact afterward. Otherwise,
living movement, contact and separation resolve before evaluating death then time.
The terminal check occurs before any new player/Shooter emission, director agenda
or reservation materialization. Death wins a tie. Reservations are canceled, auto-sail
is Off and `ended` is the unique last event after damage/destruction/score.

Active time is `min(step * fixedStepMs, sessionDurationMs)`. A 1e-7 ms comparison
tolerance compensates binary rounding; valid integer-second durations are exact at
60 Hz, with the 60s test ending at step 3600 and duration 60000ms. No survival score
is added. Completed is irreversible: step/freeze/resume cannot change its snapshot;
a subsequent inert step returns no events. Previously returned event arrays stay
frozen. `navigationLoop` delivers each step's events before the next step, never
from present/resize. Its guard prevents further input consumption in a multistep
terminal frame; completion cancels RAF and clears input, accumulator and baseline.
The frozen immediate-result arena may remain mounted until Menu/replay, with zero
advancement RAF; historical Last Result has no arena. Disposal releases ownership.

A per-preparation completion latch combines ended facts with explicit UTC metadata,
materializes one result and attempts the local write before publishing Saved on this
device. Duplicate callbacks reuse that outcome; disposed generations are ignored.
Replay disposes the former latch and owner and builds another engine, resetting RNG,
IDs, director/reservations, weapons, entities, score/health/time and all input.

`configurationKey` is `gameplay-v1:` plus complete recursive canonical JSON: object
keys sort lexicographically; arrays retain order. Every gameplay field and version
is included. Seed, identity, presentation size and preferences are outside GameConfig.
This is a representation, not a short hash; there are no hash collisions. Equivalent
property insertion order produces the same key; changing archetype order changes it.

`domain/validation.ts` validates unknown complete historical configuration against
all required typed leaves, finite/sign/integer bounds, valid options, supported rule
switches, uint32 seed, archetype enums, usable convex shoreline geometry and a valid
player start. It never fills missing history with current defaults. Result validation
also checks nonempty identity, UTC calendar, nonnegative safe-integer score, duration
within the captured limit (equal for time_expired), reason and canonical key equality.
Every accepted result is copied/frozen, including its historical geometry/tuning.

`storage/local.ts` uses `{ version: 1, data }` envelopes at
`pirate-battle.options.v1`, `pirate-battle.identity.v1`, and
`pirate-battle.last-result.v1`. JSON is unknown until fully checked. The storage
getter, reads, parsing and writes are isolated by try/catch. Invalid options use
current defaults with visible explanation; invalid result data is unavailable rather
than reconstructed. Denied/quota writes retain the new result in memory for this
visit and leave the prior stored result untouched. Status reports failure honestly.
The adapter saves only completed results, never active sessions or abandonment.
Refresh reopens Menu and recovers only the last valid completed result. No network,
outbox or remote Recorded/Pending state is implied.


## Options transaction and DOM artwork

Main Menu → Options is local React navigation. Opening rereads the defensive local
adapter; missing data uses defaults and corrupt data adds an explanation without
writing. `ui/optionsDraft.ts` stores two strings in seconds and derives help from
`OPTION_METADATA` (milliseconds in the domain). It accepts complete decimal text,
rejects empty/nonfinite/nondecimal values, converts seconds to milliseconds exactly
and calls `validateOptions` for authoritative bounds/granularity. There is no
rounding, truncation or clamping. The form keeps invalid intermediate text and
associates labels, help and inline errors with native inputs.

The transaction is draft → validation → adapter write → confirmed return. Disabled
Save and a submit guard both reject invalid drafts before the writer. A false or
throwing writer keeps Options/draft and an alert; only a confirmed write closes it.
Cancel/Escape discard without writing. Entry focuses the title and exits focus
Options. No arena, RAF or combat input is mounted while editing. A current options
notice is separate from boot identity/result notices; successful repair resolves
only its own warning, including on subsequent Play. Play always rereads saved
options; `preparePlay` captures the full immutable setup before Loading. There is
no live binding between form/storage and an existing run or historical result.
Replay uses the last successful Save, retaining historical configuration unchanged.
The UI demonstration in README uses a saved 60/1.5-second setup, an external
storage edit during play, a completed historical result, then a new 90/2.5-second
Save and Last Result → Play Again. `tests/e2e/options.spec.ts` checks unchanged
captured data, a different match ID, current saved replay options and identical
historical storage. The same flow checks discarded and denied drafts. Lifecycle,
loading/Retry and resource ownership regressions remain in `arena.spec.ts`.

`ASSET_MANIFEST` records gameplay and DOM PNGs. `DOM_ASSET_IDS` explicitly excludes
menu decoration and catalog-only UI references from required Pixi `ASSET_URLS`;
cache leases/Retry/teardown continue to own gameplay textures. New DOM image failures
leave CSS backgrounds, real labels and controls usable and cannot fail arena loading.
The title has a semantic text fallback. Menu/Options use the measured 384×480 panel
with border-image slices 40/32/40/32, content inset 30/26, and flexible center fill.
Buttons preserve 256:88 proportions and the supplied label inset; primaries select
normal/hover/pressed/disabled, secondaries normal/pressed with an additional semantic
focus outline. Secondary hover retains its own normal artwork. Disabled actions
have no hover/pressed transition. UI_LAYOUT records anchor, content, border, outer
and label rectangles in logical 1× units; tests compare default/retina metadata.
CSS safe areas and normal vertical flow permit scrolling on short/narrow screens.
No source artwork conversion or animation was introduced.

## Responsive battle controls and presentation

The input buffer composes keyboard sources and a set of pointer IDs for each weapon.
Releasing one source cannot erase another. The joypad has one owner; displacement
uses CSS pixels and an inclusive 15% radius dead zone. Outside it the adapter emits
a normalized direction and a manual movement request, at fixed configured speed.
Release or returning to center removes manual motion but retains the last valid
direction. R On therefore continues turning toward that direction. The engine
uses its existing shortest arc (positive half-turn tie), finite turn rate, forward
movement and swept hull collision for both logical steering forms. Invalid vectors
retain heading. Only the simulation advances movement, cooldowns and active time.

Each touch control captures its original native pointer. Dragging away retains Q/W/E
until up, cancel or lost capture. R queues one edge only for an uncancelled up inside
the original hitbox; automatic lost capture after up and compatible click cannot
duplicate it. Keyboard activation of a focused skill uses one consumable pulse.
Focus among the sailing region and skills is one context. Menus, forms, pause and
result dialogs retain native behavior. Pausing, hidden/blur, ending and disposal
release all captures and clear sources, steering and pending edges; Resume requires
fresh input. Listeners are owned and removed with the battle resource.

Initial mode follows `(pointer: coarse)`, independently of maxTouchPoints. Actual
touch selects touch; gameplay mouse/keyboard selects desktop. Pointer type and touch
source capabilities filter compatibility events. A mode change clears old sources
and calls explicit `neutralizeAutoSail`, which republishes without stepping or
altering match setup, position, heading, health, score or time. Resize changes no
logical input, mode or auto-sail. There is one simulation RAF and no HUD clock.

React's semantic HUD receives numeric cooldown remaining/duration and text in the
existing status publication, quantized to tenths of a second; Ready is authoritative
zero. Independent fill fractions and seconds freeze exactly while paused. R exposes
On/Off and health supplies a numeric meter. Cooldown changes are not live-announced.
Desktop places QWER above centered bottom health; touch puts health at the top,
joypad left and skills right, using 2×2 on portrait. Every touch action is at least
48 CSS pixels with visible keyboard focus. CSS supplies artwork and readable fallback.

The top and bottom DOM bands include their safe-area padding. The existing resize
observer watches both bands and the host, including mode/content changes without
an external resize. Their actual CSS rectangles form the single viewport inset
source; the renderer never adds vertical safe areas again. Left/right safe areas
are applied once. Input inverts that same uniform transform, without multiplying
CSS coordinates by DPR. An empty available area is explicitly non-renderable.

Each living ship ID owns a horizontal Pixi Graphics health bar, separate from its
rotating sprite. Geometry clamps health and bar rectangles to the world and converts
24×4 CSS pixel minimums through the world scale. Bars track snapshots, survive pause
and resize, and are destroyed on death/exit without destroying borrowed textures.
Read-only diagnostics expose bar geometry/count, capture ownership, composed sources
and mode, never gameplay setters. DOM icons, round states and health art are excluded
from required Pixi loads. Metadata remains in logical 1× atlas units, including the
health fill rectangle (30,15,196,20); source images are unchanged.

Native CDP contacts verify trusted touch PointerEvents and native capture in
Chromium. This is browser input emulation, not a physical phone or notch test.
Controlled CSS safe areas verify geometry. Reports08 preserve all earlier evidence.



## Battle feedback, audio and accessibility (Increment 09)

The battle feedback layer adds audiovisual polish and accessible reporting without violating core isolation:
- **Simulation events (`src/simulation/contracts.ts`)**: Pure discriminated `SimulationEvent` union includes `fire` (emitter ID, weapon type, world muzzle positions, heading) and `water_hit` (world coordinates), decoupled from rendering or audio.
- **Web Audio subsystem (`src/audio`)**: Native Web Audio API initializes with user-gesture unlock (`__audioUnlocked`), master gain node for mute control (persisted in LocalStorage key `pirate-battle.sound-muted.v1`), polyphony bounded to 4 concurrent effect voices with priority-based voice stealing (`critical` > `high` > `normal`), threshold sentinels triggering single-shot alerts (`health_low.wav` at ≤25% hull and `time_warning.wav` at 10s remaining), acoustic backlog purge and loop coordination during Pause/Resume, and a silent no-op fallback in headless environments.
- **Pixi visual effects (`src/render/battleEffects.ts`)**: Independent effects layer atop the arena handles muzzle flashes, rotating/fading wood debris (`wood_1..4.png`), 3-frame explosions (`explosion_1..3.png`), sinking ship fade and shrink, and floating score texts (`+1`). Hull visual states reflect integrity: healthy (>60%), damaged (25%–60% tint), and critical (≤25% tint with animated 2-frame fire overlay `fire_1..2.png`). All particle updates strictly freeze when paused. Media query `prefers-reduced-motion: reduce` suppresses high-motion effects without altering the authoritative simulation.
- **Accessibility & Focus management (`src/ui`)**: `BattleHud` incorporates a polite live region (`role="status"`, `aria-live="polite"`) announcing battle milestones (critical damage, 10s warning, kill score, pause/resume) without frame spam. Modal dialogs (`Dialog.tsx`) enforce keyboard focus containment (`Tab`/`Shift+Tab` focus trap) and restore prior focus on unmount. Mute toggles provide accessible labels and ≥48×48 CSS px touch areas across both the HUD and Options screens.

## Mock REST API, Persistent MSW and Data Layer (Increment 10)

Increment 10 delivers the complete mock REST boundaries and persistent storage specified in GDD v0.2 sections 12 and 13:
- **Contracts and Axios client (src/data/contracts.ts, src/data/client.ts)**: Strongly-typed request/response models with generic pagination (PaginatedResponse<T>), queries (RankingQuery, PlayerMatchesQuery), and semantic errors (ApiError, ConflictError, ValidationError). Axios client encapsulates GET /api/ranking, GET /api/players/:playerId/matches, and POST /api/matches with isomorphic base URL fallback (http://localhost for Node tests, root-relative for browser).
- **Persistent Confirmed Matches Store (src/mocks/store.ts)**: Dedicated repository under LocalStorage key pirate-battle.confirmed-matches.v1, completely decoupled from active match memory and the immediate pirate-battle.last-result.v1 snapshot. Supports automatic seeding with 11 deterministic captain fixtures (src/mocks/fixtures.ts), safe in-memory fallback during storage quota exhaustion or security restrictions, and strict idempotency for match registrations (200 OK for identical replay, 409 Conflict for divergent payload on identical matchId).
- **Deterministic Ranking Algorithm**: Triple-keyed sorting for leaderboard fairness:
  1. Primary: score DESC
  2. Secondary: completedAt ASC (chronologically earlier attainment takes precedence)
  3. Tertiary: matchId ASC (lexicographical tie-breaker)
  Matches are strictly filtered against the canonical configurationKey.
- **Player Match History**: Sorted by completedAt DESC (most recent first) filtered by playerId.
- **Mock Service Worker (src/mocks/)**: Handlers in src/mocks/handlers.ts serve all three endpoints with schema validation. Browser integration via setupWorker in src/mocks/browser.ts and Node testing via setupServer in src/mocks/server.ts.
- **Resilient Initialization (src/mocks/init.ts)**: Asynchronous bootstrap called before App render in src/main.tsx. Enforces a 1500ms timeout race. Any failure (missing ServiceWorker API, browser permission blocks) logs a warning and allows immediate, unimpeded gameplay ("service failure does not block Play").
- **Local Identity Persistence (src/api/identity.ts)**: Auto-generates and persists unique player identity (playerId: UUID v4, playerName: Captain-XXXX from first 4 uppercase hex chars) under pirate-battle.identity.v1.

## Reliable Result Delivery and Outbox Pattern (Increment 11)

Increment 11 delivers the client-side reliable Result Outbox pattern, TanStack Query mutation integration, and delivery lifecycle management mandated by GDD v0.2 sections 8, 9, and 12:

### 1. Architectural Boundaries & Data Flow
```
[Game Engine / Simulation]
       │
       ▼ (player_destroyed | time_expired)
[Session Completion Boundary]
       ├──► 1. Save Last Result (pirate-battle.last-result.v1)
       └──► 2. Atomic Enqueue to Outbox (pirate-battle.outbox.v1)
                  │
                  ▼
          [Outbox Dispatcher]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
[TanStack Query]     [Axios Client]
        │                   │
        └─────────┬─────────┘
                  ▼
          [POST /api/matches]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    (Success)            (Error)
 200/201 Confirmed       ├── HTTP 400 (Validation)  ──► Permanent Failure (no loop)
        │                ├── HTTP 409 (Conflict)    ──► Permanent Failure (no loop)
        ▼                └── Transient (5xx/Timeout)──► Exponential Backoff (1s, 2s, 4s <= 3x)
[Remove from Outbox]                                             │
                                                                 ▼
                                                        Transition to "failed"
                                                        (Pending — Retry visible)
```

### 2. State Machine & Delivery Lifecycle
The client delivery cycle transitions through four explicit states:
- `pending`: Enqueued prior to network request or awaiting an exponential backoff retry.
- `recording`: Currently in-flight over HTTP. Displayed as `Recording…` in UI.
- `recorded`: Server confirmation acknowledged (HTTP 200 or 201). Removed from outbox. Displayed as `Recorded` in UI.
- `failed`: Terminal state after 3 failed attempts or permanent validation/conflict error. Displayed as `Pending — Retry` in UI with a manual `Retry` action.

### 3. Key Guarantees
- **Atomic Pre-POST Enqueue**: When a match completes, `local.saveResult` and `outboxStore.enqueue` run synchronously before any network mutation is initiated. Browser crashes or refreshed tabs retain the pending item intact.
- **Strict Abandonment Isolation**: Abandoning a match during combat or leaving while Loading never writes to `Last Result` nor the Outbox. Abandoned sessions generate zero remote traffic.
- **Idempotence & Post-Commit Timeout Recovery**: Network timeouts occurring after the MSW store has committed the record respond with HTTP 200 OK on retry. The outbox recognizes the confirmed record and removes the entry without creating duplicate ranking entries.
- **Bounded Exponential Backoff & Loop Prevention**: Transient network dropouts (status 0, timeout, 5xx) schedule retries with exponential backoff (1s, 2s, 4s, bounded to 3 attempts). Permanent errors (HTTP 400 validation error or HTTP 409 conflict error) permanently halt automatic retries, displaying a human-readable message without infinite loops.
- **Strict Visual Isolation**: The `Result` view filters state updates exclusively by the `matchId` of the viewed match. Delayed background delivery of older matches cannot overwrite or disrupt the active result screen.
- **Defensive Storage Fallback**: QuotaExceededError or security restrictions automatically fallback to an in-memory queue. Gameplay never crashes on storage failure.
- **Menu Outbox Monitor**: The `MainMenu` actively observes outbox entries. If any match remains unconfirmed, it displays an alert badge (e.g., `1 pending match record`) and a `Retry Pending` action button.

## Paginated Ranking and Match History (Increment 12)

Increment 12 implements accessible, paginated leaderboard tabs and local match history in the Main Menu, strictly adhering to GDD v0.2 sections 9 and 12, as well as the resilience requirements of the challenge:

### 1. Data Architecture & TanStack Query Hooks
- **Composite Query Keys**: Queries follow canonical composite structures:
  - Ranking: `['ranking', configurationKey, page, pageSize]` (default `page: 1`, `pageSize: 10`).
  - Match History: `['history', playerId, page, pageSize]` (default `page: 1`, `pageSize: 10`).
- **Smooth Pagination with `keepPreviousData`**: Uses TanStack Query's `placeholderData: keepPreviousData` to prevent visual flicker and retain visible rows while adjacent pages load in background, setting `aria-busy="true"` on the table container during in-flight fetches.
- **Request Cancellation via `AbortSignal`**: `getRanking` and `getPlayerMatches` in `src/data/client.ts` accept optional `RequestOptions` (or `signal` in query) and forward it to the underlying Axios request. Rapid pagination or tab switching aborts stale in-flight requests, preventing out-of-order response overwrites.
- **Reactive Cache Invalidation from Outbox**: `outboxService.ts` automatically invalidates queries under both `['ranking']` and `['history']` prefixes upon HTTP 200/201 match confirmation, allowing newly recorded matches to appear on the leaderboard in real time without refreshing the page.

### 2. Semantic Components & WAI-ARIA Accessible Navigation
- **WAI-ARIA Tabs Structure**: `LeaderboardTabs.tsx` implements standard accessible tabs:
  - Tablist container with `role="tablist"` and `aria-label="Rankings and History"`.
  - Tab controls with `role="tab"`, `aria-selected`, `aria-controls`, and roving `tabIndex` (0 on active tab, -1 on inactive tab).
  - Tab panels with `role="tabpanel"`, `aria-labelledby`, `tabIndex={0}`, and `hidden` attribute when inactive.
  - Keyboard navigation supporting `ArrowLeft` / `ArrowRight` (and `ArrowUp` / `ArrowDown`), `Home`, and `End` keys to cycle and focus tabs without mouse interaction.
- **Active Configuration Filter**: The Ranking tab prominently displays the current battle settings (e.g. `Configuration: 120s session · 3.0s enemy spawn`), clarifying to players that rankings group only identical match rules and that changing Options selects an independent leaderboard rather than erasing prior scores.
- **Player Match History Formatting**: Formats records exclusively for the local `playerId`:
  - Date and time in the viewer's locale via `toLocaleString()`.
  - Active combat duration in seconds (excluding loading and pause).
  - Readable end reasons (`Time expired` and `Ship destroyed`).
  - Summary of the match configuration.
- **Canonical GDD Empty Messages**:
  - Ranking: `"No matches for these settings yet."`
  - Match History: `"No completed matches yet."`
- **Isolated Error Boundaries & Retry Action**: Network errors in either tab display a scoped `role="alert"` container with a dedicated `Retry` action. An error in Ranking never blocks Match History, and neither blocks local gameplay ("Play", "Options", and "Last Result").
- **Responsive 320px Viewport Compliance**: Tables are wrapped in containers with `overflow-x: auto` and `-webkit-overflow-scrolling: touch`. All interactive buttons maintain a minimum 44px touch target height.

## Network Scenario Controls & Diagnostics (Increment 13)

Increment 13 delivers the central network scenario orchestrator (`src/mocks/scenarios.ts`), declarative MSW handlers (`src/mocks/handlers.ts`), accessible diagnostics UI (`NetworkScenarioPanel.tsx`), and deterministic simulation decoupling mandated by GDD Section 13:

### 1. Centralized Orchestrator & The 12 Regulatory Scenarios
- **Catalog & Typing**: `src/mocks/scenarios.ts` exports typed definitions for all 12 regulatory profiles:
  - `default`: Standard 200 OK responses with canonical fixtures and nominal 0–50ms latency.
  - `empty`: 200 OK responses with `{ items: [], totalItems: 0 }` for ranking and history.
  - `multi-page`: Expanded deterministic dataset (35+ matches across 4 pages) to validate pagination controls.
  - `slow-jitter`: Responses delayed by variable 1,500ms–2,500ms jittered latency to test loading states and `aria-busy`.
  - `out-of-order`: Alternates fast (150ms) and slow (1,500ms) latency to exercise `AbortSignal` cancellation on rapid navigation.
  - `timeout`: Deliberately exceeds client timeout threshold (>30s) to trigger timeout errors and retry transitions.
  - `offline`: Immediate network transport error (`HttpResponse.error()`) emulating offline/airplane mode.
  - `error-4xx`: 400 Bad Request error response verifying that permanent errors halt outbox retries immediately.
  - `error-5xx`: 500 Internal Server Error response exercising exponential backoff and transient retry cycles.
  - `isolated-tab-failure`: Ranking endpoint fails with 500 while player match history succeeds with 200 OK.
  - `commit-timeout`: On `POST /api/matches`, the result is committed to the confirmed matches store atomically, but the HTTP response is dropped; subsequent retry by outbox succeeds idempotently (200 OK) without duplicate creation.
  - `temporary-outage`: First 2 requests fail with connection errors; 3rd request onward recovers with success.

### 2. Cascading Precedence Resolution
Active network scenario resolution follows strict cascading hierarchy:
1. `URLSearchParams` (`?networkScenario=<id>`): Highest precedence. Allows Playwright E2E tests and reproducible links to run isolated scenarios without storage contamination.
2. `localStorage` (`pirate-battle.network-scenario.v1`): Persists user selection made via UI across page reloads.
3. `window.__pbNetworkScenario`: In-memory runtime override for programmatic tests or developer console inspection.
4. Default Fallback (`'default'`): Active when no override exists or an unknown identifier is provided.

### 3. Strict Reset Policy (`resetMockData`)
- **Restores Only Confirmed Fixtures**: Clears and re-seeds `pirate-battle.confirmed-matches.v1` back to `DETERMINISTIC_FIXTURES`.
- **Resets Volatile Counters**: Resets transient scenario counters (temporary outage request count, out-of-order toggle, commit-timeout match map).
- **Invalidates TanStack Query Cache**: Automatically calls `queryClient.invalidateQueries({ queryKey: ['ranking'] })` and `queryClient.invalidateQueries({ queryKey: ['history'] })`.
- **Inviolable Data Preservation**: Never deletes or modifies user options (`pirate-battle.options.v1`), player identity (`pirate-battle.identity.v1`), last completed result (`pirate-battle.last-result.v1`), pending outbox submissions (`pirate-battle.outbox.v1`), or sound settings (`pirate-battle.sound-muted.v1`).

### 4. Active Combat Simulation Decoupling
- **Zero Simulation Disruption**: Changing network scenarios or triggering mock data reset operates strictly in background and never restarts, interrupts, or alters an active combat session in `<Arena>`.
- The simulation engine loop, entity positions, player health, score, and remaining timer proceed continuously without frame drops or reloads.
- The configured scenario takes effect only when the match concludes and results are submitted over the network.

### 5. Accessible Diagnostics Panel in UI
- Integrated in `MainMenu.tsx` below `LeaderboardTabs`.
- Built with semantic `<details>` and `<summary>` elements.
- Accessible `<select>` dropdown with all 12 regulatory profiles and live descriptive badge.
- Secondary "Restore Default Scenario" button visible whenever a non-default profile is active.
- Dedicated status announcement container (`role="status"`, `aria-live="polite"`).
- All interactive targets maintain minimum 44 CSS px touch areas and adapt to 320 CSS px mobile viewports without horizontal scrolling.

## End-to-End Validation & Visual Regression Architecture

In accordance with GDD Section 14, system-level validation is executed across Chromium desktop and mobile environments using Playwright:

### 1. Multi-Platform Execution Profiles
- `desktop-chrome`: 1280x900 viewport, standard Chromium browser.
- `mobile-chrome`: 390x844 viewport (Pixel 5 emulated profile) with `hasTouch: true` and `isMobile: true`.
- Output artifacts directed to `project/automation-reports/14-validate-game-end-to-end/`:
  - Official HTML report: `project/automation-reports/14-validate-game-end-to-end/playwright-report`
  - Failure traces and screenshots: `project/automation-reports/14-validate-game-end-to-end/test-results`

### 2. Deterministic Visual Regression Baselines
Versioned under `tests/e2e/visual-regression.spec.ts-snapshots/` with disabled CSS transitions and fixed deterministic seed (`seed=424242`):
- `main-menu-desktop`: Canonical desktop Main Menu layout (1280x900).
- `main-menu-mobile`: Canonical mobile Main Menu layout (390x844).
- `main-menu-focused`: Main Menu under accessible keyboard focus (`:focus-visible` ring on Play button).
- `battle-desktop-paused`: Paused arena battle displaying Pixi canvas with northwest island and bottom-centered HUD.
- `battle-mobile-hud`: Mobile battle arena displaying top status bar, virtual analog joypad, and touch action buttons.
- `options-modal-desktop`: Accessible Options dialog modal on desktop.
- `options-modal-mobile`: Accessible Options dialog modal on mobile viewport.
- `result-screen-desktop`: Completed match Result screen displaying metrics, reason, and `Recorded` delivery status.

### 3. Integrated Player Journey Suite
Implemented in `tests/e2e/integrated-journey.spec.ts`:
- **Simultaneous Controls**: Auto-sail (R) without key repeat alongside concurrent Q+W+E weapon discharges instantiating 7 projectiles with independent HUD cooldowns.
- **Island Contact**: Tangential sliding on shoreline collisions without vessel stoppage or hull damage.
- **Atomic Destruction**: Simultaneous broadside hits destroying enemy Chasers with strictly single-point (+1) score increments.
- **Strict Terminal Priority**: Lethal hull damage on the final simulation tick reports `player_destroyed` rather than `time_expired`.
- **Safe Match Abandonment**: Abandoning from the pause modal confirmation returns to the Main Menu without updating `Last Result` or enqueuing to the Outbox.
- **Simulation Freeze**: Manual pause ('P', Escape), window blur, and document visibility loss halt simulation with zero catch-up advancement upon resume.
- **Mobile Touch Resilience**: Joypad `pointercancel` event neutralizes direction immediately without lingering or latching auto-sail.
- **End-to-End Data Cycle**: Completed match propagates from storage through the Outbox via MSW REST endpoint to live Ranking and Match History tables.
- **Network Resilience**: Validates idempotent recovery on `commit-timeout` and `AbortSignal` discarding on `out-of-order` responses.

## Gameplay Tuning, Profiling & Hot-Loop Architecture (GDD §15)

In accordance with GDD Section 15, gameplay performance, telemetry, and hot-loop execution budgets are guaranteed through targeted architectural optimizations:

### 1. Simulation Engine Hot-Loop Optimization
- **Cached Immutability**: `createSimulation` in `src/simulation/engine.ts` advances internal state across `step()` ticks without performing recursive deep copies or eager `Object.freeze` on every tick.
- **Lazy Frozen Boundary**: External consumers querying `inspect()` or `events()` receive cached immutable snapshots created on-demand. Caches are invalidated when state transitions or new simulation events are generated.
- **Mathematical Determinism**: Step calculations, collision math, and RNG states remain strictly byte-for-byte identical, verified via snapshot comparisons and replay equality tests in `tests/simulation.test.ts`.

### 2. Render Node & Battle Effect Object Pooling
- **Projectile Sprite Pooling**: `src/render/pixiPreview.ts` maintains a reusable `projectilePool: Sprite[]`. Cannonball sprites are acquired from the pool on spawn and returned on expiry with `visible = false` and property resets, eliminating continuous GC pressure and sprite destruction overhead.
- **Particle & Floating Text Pooling**: `src/render/battleEffects.ts` pools muzzle flash sprites (`muzzleFlashPool`), wood debris particles (`woodParticlePool`), and floating score indicators (`floatingScorePool`). Node states and alpha/scale properties are reset on reactivation.
- **Teardown Lifecycle**: Arena disposal clears active and pooled instances with `{ texture: false, textureSource: false }`, ensuring zero leaked container children or lingering textures upon returning to the menu.

### 3. Automated Telemetry and Profiling
- **Headless Simulation Benchmark**: Implemented in `tests/simulation-benchmark.test.ts`, executing 10,800 ticks (180s virtual match) under standard (3.0s spawn) and stress (1.0s spawn) scenarios, verifying CPU time per tick remains well within the <0.8ms budget (~0.05ms–0.22ms observed).
- **E2E Performance Profiler & CDP Memory Audit**: Implemented in `tests/e2e/performance-profile.spec.ts`. Collects in-page frame interval telemetry (FPS, p95 interval, janks) and validates 5 full match cycles using Chrome DevTools Protocol to confirm zero residual listeners/applications/DOM nodes and sustained JS heap stability (<5MB growth across cycles).

### 4. Canonical Balance Versioning
- **Version Identifier**: Centralized as `balance-v1` in `src/domain/config.ts`.
- **Deterministic Key Derivation**: Incorporated directly into `configurationKey()` to guarantee configuration integrity, reproducible ranking partitions, and backward-compatible option migration.
