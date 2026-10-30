# Pirate Battle — Game Design Document

Version: 0.2 · Date: 2026-10-27 · Status: proposed design with confirmed control and HUD direction, ready for implementation planning.

## 1. Document authority

This GDD translates the supplied React & PixiJS challenge and the repository assets into a playable design. Challenge requirements are mandatory. Values and behaviors explicitly marked as proposals are initial design decisions, subject to playtesting; they do not claim to be supplied requirements or implemented features.

The interface, code identifiers, and delivery documentation use English. This file is a design document, not an OpenSpec change or an implementation report. Implementation decisions will be expanded in `ARCHITECTURE.md`.

## 2. High concept

**Pitch:** Command a pirate ship in a tropical arena, turn through narrow waters, and time frontal shots and broadsides to destroy as many enemy ships as possible before the clock or your hull runs out.

| Item | Design |
| --- | --- |
| Genre | Single-player, top-down naval arena shooter |
| Platform | Desktop and mobile browsers |
| Session | 60–180 seconds of active play; proposed default: 120 seconds |
| Camera | Fixed overhead view; entire arena remains visible |
| Objective | Maximize destroyed enemies while surviving |
| Audience | Players seeking short arcade sessions with accessible controls and positional combat |
| Visual tone | Colorful, readable pirate adventure; stylized destruction |
| Progression | Personal mastery, match history, and scores within comparable configuration groups |

### Design pillars

1. **Position creates opportunities.** The bow and both broadsides require different alignments; turning is a combat decision.
2. **Threats remain readable.** Ship silhouettes, sails, projectiles, health indicators, and sound communicate danger without hiding the sea lanes.
3. **Short runs invite another attempt.** Immediate controls, clear results, and a clean restart support repeated play.
4. **The battle remains available.** Ranking and history failures never prevent local gameplay.

### Scope boundaries

One arena, one player ship, two enemy archetypes, three player attacks, configurable sessions, and the required menus and data flows form the delivery scope. No campaign, multiplayer, upgrades, loot, bosses, procedural maps, account service, or permanent stat improvements are planned. Decorative cannons, forts, and dinghies shown in reference art do not introduce extra enemy types or mechanics.

## 3. Player experience and core loop

`Main Menu → Play → Asset Loading → Battle → Result → Play Again / Main Menu`

During combat: observe approaching threats → advance and turn around islands → align the bow or a broadside → fire → read damage and destruction → reposition → repeat.

A match succeeds as a survival run when the timer expires with health remaining. Sinking ends the run early. Both outcomes record the earned score; there is no minimum score to complete a match. No points are awarded merely for surviving.

The first few seconds establish movement and the first Chaser. A Shooter appears by the second successful spawn. Pressure grows naturally as surviving enemies accumulate; the initial design has no hidden difficulty ramp or changing spawn interval.

## 4. Controls and ship handling

### Desktop bindings — confirmed direction

| Action | Keys | Behavior |
| --- | --- | --- |
| Front cannon | Q | Hold to fire whenever this weapon is ready |
| Port broadside | W | Hold to fire to the ship's left |
| Starboard broadside | E | Hold to fire to the ship's right |
| Auto-sail passive | R | Press once to enable continuous forward movement; press again to stop |
| Steering | Mouse position | Turn toward the pointer's position in the arena |
| Pause | Escape / P | Opens pause dialog during active gameplay |

Q, W, E, and R are the skill row in that order. R is a toggleable movement passive, not an attack, and has no cooldown or resource cost. Handle it on the key-down edge, ignoring keyboard auto-repeat. Q/W/E retain independent weapon cooldowns and can fire simultaneously while the ship moves.

While auto-sail is enabled, the ship continuously advances along its current heading and turns toward the mouse. The mouse selects a destination direction, not an instantaneous ship position: the configured forward and turn speeds still apply. Front and lateral shots follow the actual hull orientation, not a separate mouse-facing turret. There is no reverse or strafing.

Proposed steering details: auto-sail starts disabled for each match; the ship may turn toward the mouse while stopped so the player can aim before enabling R. Use a small 12-unit dead zone around the ship to prevent heading jitter. Sailing remains enabled on arrival and keeps the last heading inside that dead zone. Converter pela câmera atual e armazenar direção relativa ao navio, sem clamp de coordenadas assinadas. Before the first valid mouse position, retain the initial heading. Saída do ponteiro conserva a direção; focus loss pauses the game. Colisões de ilha continuam autoritativas: auto-sail does not provide automatic pathfinding around land.

### Mobile controls — confirmed layout

Place a circular directional joypad in the lower-left corner and four skill buttons labeled Q, W, E, and R in the lower-right corner. Q fires forward, W fires left, E fires right, and R toggles auto-sail, matching desktop. Touch controls show attack icons as well as the letters. A separate pause button stays in the upper HUD.

Proposed joypad behavior: displacement beyond a 15% dead zone selects the desired heading and requests forward movement at the configured speed. The ship turns toward that direction at its configured turn rate; it does not strafe. Releasing the joypad stops movement when R is off. When R is on, release continues forward movement along the last selected heading; moving the joypad changes that heading. This gives mobile direct movement and the same optional cruise passive without requiring a mouse. R has a persistent On/Off indicator.

Track the joypad and skill buttons with separate pointer IDs so steering and attacks work simultaneously. Capture each pointer for its original control; release or cancellation clears that pointer's held input. Cancellation must not toggle R. Use touch targets of at least 48 CSS pixels with spacing and safe-area padding.

Show the relevant controls before play and during combat. Menus use standard keyboard navigation and touch interactions. Capture gameplay keys only while the active battle owns input; prevent page scrolling for captured keys in that context.

## 5. Arena and navigation

### Procedural ocean

O mundo padrão não possui perímetro jogável. A câmera imediata acompanha o player na área central livre do HUD e preenche a tela, inclusive sob controles. 960×540 é referência visual; coordenadas podem ser negativas. Início (480,270), para cima, com disco de água livre de raio 160.

Catálogo: compacta 160×120, alongada 160×280 e larga 320×120, com tiles proporcionais de 40 unidades. Layouts de duas a quatro ilhas usam pares designados com alvos iniciais de 160/280/440 entre litorais reais e tolerância 1. São hipóteses técnicas de calibração, não valores confirmados por playtest. Outros pares preservam mínimo 160; margens de água 80 por lado de região 1280×1280 conectam vizinhos e permitem manobra. Folhagem e pedras continuam decorativas.

Configuração versionada e seed determinam cada região independentemente da exploração. Terreno e sprites distantes são reconstruídos nas revisitas. Navegação combina corredores regionais e A* local com contornos inflados pelo raio. Ilhas bloqueiam cascos/balas; tela e regiões não são sólidos. Movimento conserva deslizamento sem dano de litoral.

Spawns ficam a 240–520 do player, independentemente da câmera, com revalidação de faixa, terreno, ocupação e rota após 600ms ativos. Cadência, alternância por sucesso, 64 tentativas e ausência de backlog permanecem. Entidades ocultas continuam IA/combate até destruição ou fim, com mesmos IDs, saúde e cooldowns, sem cap/despawn adicional. Armas, giro, saúde, dano e score conservam os valores anteriores. Tempo padrão 120s, opções 60–180s e término por tempo ou morte permanecem.

**Proposed collision model:** circular ship bodies, circles for cannonballs, and convex or rectangular pieces for islands. The ship radius covers the solid hull rather than the sail's transparent rectangle. Swept projectile collision selects the earliest impact along each movement segment to prevent fast cannonballs crossing thin obstacles between steps.

Ship-to-ship overlap is separated without damage, except a Chaser touching the player. A Shooter's hull does not inflict contact damage. A separação nunca empurra o player para terra; não há paredes procedurais.

## 6. Combat rules

### Player attacks

| Weapon | Pattern | Tactical purpose |
| --- | --- | --- |
| Front cannon | One projectile along the heading | Precise pursuit and direct approaches |
| Port broadside | Three parallel projectiles perpendicular to heading, to port | Punish targets alongside the ship |
| Starboard broadside | Three parallel projectiles perpendicular to heading, to starboard | Same function on the opposite side |

Broadside projectiles originate at three positions distributed along the hull, separated by a proposed 14 logical units. They travel in parallel, without fan spread or homing. Every cannonball is an independent damage opportunity; several balls may hit one surviving target. Spawn projectiles just outside the hull, checking for an immediately adjacent obstacle.

Player fire damages enemies only. Enemy fire damages the player only. All projectiles collide with islands and arena bounds. Friendly fire, projectile-to-projectile collisions, splash damage, and piercing are disabled.

A projectile is consumed on its first valid hit, including a blocked hit, or when its lifetime expires or it leaves the arena. It applies damage at most once. Use an atomic alive-to-destroyed transition so simultaneous hits cannot score the same enemy twice. Destroyed enemies immediately stop moving, firing, colliding, and dealing damage; a remaining explosion is visual only.

### Initial balance proposal

These are tuning hypotheses, not measured balance. All numbers belong in one typed gameplay configuration.

| Parameter | Player | Chaser | Shooter |
| --- | ---: | ---: | ---: |
| Maximum health | 100 | 40 | 60 |
| Forward speed, units/second | 150 | 115 | 90 |
| Turn speed, degrees/second | 180 | 140 | 110 |
| Hull collider radius, units | 18 | 16 | 18 |
| Contact damage | — | 25, once before destruction | 0 |

| Weapon parameter | Front | Each broadside | Shooter cannon |
| --- | ---: | ---: | ---: |
| Damage per projectile | 20 | 20 | 10 |
| Projectiles per activation | 1 | 3 | 1 |
| Cooldown, active seconds | 0.35 | 1.20 | 1.50 |
| Projectile speed, units/second | 420 | 360 | 260 |
| Lifetime, active seconds | 1.20 | 1.00 | 1.50 |
| Derived maximum travel, units | 504 | 360 | 390 |

Initial weapons are ready when the match starts. A Shooter waits one full cannon cooldown after entering firing range before its first shot. No random critical hits or damage variance. Proposed damage protection is zero seconds: each distinct valid projectile can deal damage, while a Chaser can collide only once.

### Scoring

Every enemy destroyed by player attacks awards exactly **1 point**, regardless of archetype or weapon. Chaser self-destruction on player contact awards zero. There are no combo, accuracy, time, or multi-kill bonuses.

For a deterministic simultaneous-contact policy, process existing projectile hits before Chaser contact in each simulation step. A Chaser killed in that phase cannot subsequently collide. Resolve deaths before later entities act. If the player reaches zero health on the final time step, use `player_destroyed` as the end reason; otherwise use `time_expired`. No events after the terminal transition may alter the result.

## 7. Enemies and spawning

### Chaser

Seeks the player's current position, turns at its configured turn speed, and advances. It navigates around islands rather than moving through them. On hull contact, it deals one contact hit and explodes immediately. It has no projectile weapon. Visual identity proposal: red sail with a distinct emblem, compact hull, and aggressive approach.

### Shooter

Approaches until within a proposed **300-unit** attack range, then tries to hold a **240-unit** preferred distance, using a 30-unit hysteresis band to avoid oscillation. Within range it turns toward the player and fires only with clear line of sight and an angular error of at most 10 degrees. If blocked by land, it repositions around the obstacle. It aims at the player's current position without predictive targeting. Visual identity proposal: dark pirate sail and a larger hull.

Both archetypes use obstacle-aware waypoint navigation with local separation. Navigation may use a grid inflated by hull radius, but the movement and collision rules remain authoritative. Avoid permanent stationary firing through islands or indefinitely pushing into shorelines.

### Spawn director — proposed

- Default interval: **3 seconds**; Options accepts **1–10 seconds**, in 0.5-second steps. Values must be finite and positive.
- Spawn one enemy at each interval of active play, starting after the first full interval.
- Alternate Chaser and Shooter, starting with Chaser: a deterministic 50/50 distribution over pairs. Com aviso completo, as primeiras materializações ocorrem em 3,6s e 6,6s ativos quando seguras.
- Choose positions using a seeded generator, entre 240 e 520 unidades do player, fora de ilhas/cascos e com rota regional navegável.
- Telegraph a selected position for 0.6 active seconds using a visible water ring. Reserve and revalidate the position at materialization; cancel if it becomes unsafe. The first appearance is delayed by this telegraph duration.
- If no safe position exists, skip that opportunity and retry at the next scheduled interval. Do not accumulate a spawn backlog. Advance the archetype sequence only after a successful spawn.
- Stop scheduling and materialization on pause or match end. The initial design has no live-enemy cap; evaluate the one-second setting during profiling before changing that policy.

## 8. Session lifecycle and configuration

| State | Allowed behavior |
| --- | --- |
| Menu / Options | Local navigation, configuration, ranking and history queries |
| Loading | Visible progress or loading state, asset failure and Retry; no combat clock |
| Playing | Input, simulation, damage, spawns, effects, active timer |
| Paused | Frozen simulation, clock, cooldowns, telegraphs, and gameplay effects |
| Result | Immutable completed result, recording status, replay and menu actions |

Manual pause, window blur, or hidden document transitions Playing to Paused. Returning focus does not resume the game. `Resume` requires an explicit action, clears held inputs and the joypad, and resets the wall-clock baseline so paused time never becomes simulation catch-up. Proposed safety behavior: pausing disables auto-sail; after resuming, the player explicitly enables R or moves the mobile joypad to move again. No held attack carries through pause. Pause is local and does not create a match record.

Options exposes `Game session time` (60–180 integer seconds) and `Enemy spawn time` (1–10 seconds in 0.5 increments). Show units, bounds, accessible inline errors, and Save / Cancel actions. Invalid input cannot be saved; Cancel discards edits. Persist validated settings after Save and restore defaults with a visible explanation if stored settings are corrupt.

At Play, capture an immutable full configuration snapshot, including map, balance version, spawn distribution, and hidden tuning values. A later settings change only affects another match. Use a separate seed for reproducible random choices.

The timer counts active play only. At zero time or zero player health, stop the simulation immediately and finalize exactly once. Save the last completed result locally before attempting registration. Reloading or leaving combat abandons the current run; abandoned runs never enter ranking or history and do not replace the last completed result. An in-app `Main Menu` action from pause opens `Abandon this match?` with Keep Playing / Abandon actions.

Replay creates a new match ID, snapshots current saved settings, and resets player health, score, clock, cooldowns, enemy director, projectiles, effects, input, steering targets, auto-sail (Off), and random state. Pending records from earlier matches remain independent.

## 9. Screens and information hierarchy

| Screen | Content and interaction |
| --- | --- |
| Main Menu | Pirate Battle title, Play, Options, compact control guide, Ranking and Match History tabs |
| Options | Two labeled settings, validation, Save, Cancel, current units and limits |
| Loading | Asset progress/state, failure explanation, Retry, Main Menu |
| Battle | Full arena, overhead health on every ship, score, remaining time, pause, platform-specific health HUD and Q/W/E/R skill controls |
| Pause | Paused title, Resume, Main Menu; focus contained in dialog |
| Result | Final score, active time played, `Time expired` / `Ship destroyed`, recording state, Play Again, Main Menu |
| Ranking tab | Configuration group, position, player name, score, deterministic ordering, pagination |
| Match History tab | Local player's date, score, duration, end reason, configuration details, pagination |

Use `Recording…`, `Recorded`, and `Pending — Retry` for result delivery status. A pending notice remains reachable from the menu after the player starts another match. The last completed result is recoverable after refresh through a `Last Result` action. Loading and errors in leaderboard tabs never disable Play or Options.

Proposed pagination is 10 rows per page. Keep current rows visible during background refresh and distinguish refresh from initial loading. An empty ranking says `No matches for these settings yet.`; an empty history says `No completed matches yet.` Provide a retry action on failure. Show the configuration filter so a changed setting does not appear to erase a previous score.

## 10. Responsive layout and accessibility

### Desktop HUD — confirmed layout

Anchor a compact HUD to the bottom center of the viewport. The player's horizontal health bar is the bottom element, displaying current / maximum health. Directly above it, center four skill indicators in Q, W, E, R order. Each attack indicator shows its icon, key label, readiness, a cooldown sweep or fill, and remaining cooldown in seconds while unavailable. R shows the auto-sail icon and an explicit On/Off state instead of a cooldown. Health and skills share a common centered alignment and remain inside the bottom safe area. Keep score, timer, and pause in the upper HUD.

### Mobile HUD — confirmed layout

Center the player's horizontal health bar at the top, with current / maximum health. Keep score, timer, and pause nearby without overlapping it. Anchor the circular joypad at the lower left and the Q/W/E/R skill cluster at the lower right. Each attack button includes the same cooldown and readiness feedback as desktop; R includes its On/Off state. Use a compact 2×2 skill cluster where width is limited. The center-bottom region remains free of the desktop health/skill panel.

The player HUD supplements the overhead player health indicator required by the challenge; it does not remove health bars above any ship. Render overhead indicators in PixiJS. The screen-space HUD may use React with semantic status and event-driven updates; smooth cooldown progress can use visual animation synchronized to simulation time and frozen during pause.

Support desktop and mobile in both portrait and landscape, with landscape recommended for play. Reserve top HUD space and bottom control space around the proportionally scaled arena so controls do not conceal critical combat. In portrait, the full arena sits between the upper health HUD and the lower joypad/skill region. Never crop the world to fill the screen. Preserve world coordinates on resize; resizing cannot change balance or restart a run. Verify a minimum 320 CSS-pixel viewport width and device safe areas. Switching input mode clears transient inputs and disables auto-sail to prevent unintended motion.

Menus and dialogs use semantic React controls with labels, visible focus, keyboard access, sufficient contrast, and focus restoration. Sprite borders decorate real controls rather than replacing their semantics. Health uses fill length and numeric text; enemy archetypes differ by emblem/silhouette as well as color. Weapon readiness has a visual cooldown state and an accessible label.

Expose score, rounded remaining seconds, health, and match state in semantic DOM. Announce pause, result, recording failure, low health, and final countdown milestones through polite live regions; do not announce each frame or every shot. A compact readable status can update on integer-second or meaningful value changes without repeatedly announcing it.

Honor reduced-motion preferences by reducing screen shake, flashes, and decorative motion without changing simulation. Provide a mute control; audio is supplementary and begins only after a user gesture. Avoid strobing and sustained full-screen damage overlays.

## 11. Art direction and supplied asset plan

Use turquoise water, sand and green islands, wooden hulls, bright sails, dark blue panels, and gold trim. Preserve the playful proportions of the supplied artwork. The sample screens are visual references, not flattened interactive screens or evidence of working mechanics.

| Repository asset | Planned use |
| --- | --- |
| `assets/preview.png` | Overview of ship, tile, and effect families |
| `assets/sample.png` | Combat composition and feedback reference |
| `assets/sample_menu.png`, `sample_options.png`, `sample_pause.png`, `sample_result.png`, `sample_ranking.png`, `sample_history.png` | Screen-specific art references |
| `assets/ui_scene_background.png` | Static menu backdrop; not the playable collision map |
| `assets/png/default/ships/ship_1.png` through `ship_24.png` | Ship appearance candidates; final roles and damage variants require a visual mapping pass |
| `assets/png/default/ship_parts/` | Hull, sail, cannon, flag, wood debris, and cannonball components |
| `assets/png/default/tiles/tile_1.png` through `tile_96.png` | Water, island shoreline, vegetation, rocks, and decorative structures |
| `assets/png/default/effects/explosion_1.png` through `explosion_3.png`, `fire_1.png`, `fire_2.png` | Shot, impact, destruction, and low-health effects |
| `assets/spritesheet/ships_miscellaneous_sheet*.png` and `.xml` | Packed gameplay artwork and retina alternative |
| `assets/spritesheet/ui_sheet.json` and `ui_sheet_retina.json` | UI atlas and semantic sprite metadata |
| `assets/logo_jungle_gaming.svg` | Supplied brand mark, positioned outside critical gameplay information |

The inspected UI atlas includes menu panels, title, primary/secondary/round button states, counters, health bars, and movement/attack icons. Reuse its named entries, including `panel_menu`, `counter_panel`, `icon_fire_front`, `icon_fire_left`, and `icon_fire_right`. Respect content rectangles, anchors, and border metadata. `ui` measurements and borders are logical 1× units, including when loading retina textures. Use supplied individual PNGs or a converted atlas as appropriate; record any conversion process.

**Role proposal:** player uses a light or blue sail; Chaser uses red; Shooter uses dark sails. Select exact sprite IDs after inspecting the individual candidates. Do not assume consecutive numbered files form an animation or damage sequence. Damage visuals use verified matching variants or composed hull/sail parts; overlays provide a fallback without inventing unverified asset mappings.

### Feedback specification — proposed

| Event | Visual | Audio from `assets/sounds/` |
| --- | --- | --- |
| Front shot | Short muzzle flash and readable cannonball | `cannon_fire_1.wav`–`cannon_fire_3.wav` |
| Broadside | Three brief muzzle flashes | `cannon_broadside.wav` |
| Hull damage | Brief hull flash, health reduction, small wood particles | `ship_wood_hit_1.wav` / `ship_wood_hit_2.wav` |
| Chaser contact | Local explosion and health change | `ship_collision.wav` |
| Destruction | Expanding explosion, debris, short sinking fade | `ship_explosion_1.wav` / `ship_explosion_2.wav`, optional `ship_sinking.wav` |
| Miss into water | Small water impact on expiry where appropriate | `cannonball_water_hit_1.wav` / `cannonball_water_hit_2.wav` |
| Earned point | Brief +1 near defeated enemy; HUD updates once | `score_point.wav` |
| Health ≤25% | Small flame and damaged sail; one threshold warning | `health_low.wav` |
| Final 10 seconds | Timer emphasis and a single threshold cue | `time_warning.wav` |
| Session transitions | Clear loading, pause, resume, and result states | `game_start.wav`, `game_pause.wav`, `game_resume.wav`, `game_complete.wav`, `game_over.wav` |
| Atmosphere / menus | Quiet ocean loop; restrained menu feedback | `ocean_ambience_loop.wav`, `ship_sailing_loop.wav`, `ui_*.wav` |

Healthy ships are above 60% health; damaged ships are above 25% up to 60%; critical ships are at or below 25%. Health bars remain visible above all live ships and do not rotate with the hull. Effects must not obscure projectiles, enemies, or shoreline edges. Limit simultaneous audio voices and prioritize critical cues over repetitive firing.

No license or credits file was found in the supplied asset tree during this pass. Verify source and permitted use before delivery, and document supplied and additional resources in an asset credits file. Do not infer a license from appearance.

## 12. Ranking, identity, and recording rules

Proposed local identity: generate a persistent player UUID and a readable `Captain-XXXX` display name on first visit. No authentication or external player service is required. Other captains come from fixtures. This identity and the mock ranking are scoped to the browser's stored data; the public deployment is not a shared multiplayer backend.

Each completed record contains `matchId`, `playerId`, `playerName`, `completedAt` in UTC, integer `score`, `activeDurationMs`, `endReason`, full `configuration`, `configurationKey`, and `seed`. Show dates in the viewer's locale. The active duration excludes loading, pause, and result screens.

Derive `configurationKey` from a canonical representation of all gameplay-affecting settings plus map and balance version. Exclude seed, player identity, display size, and accessibility/audio preferences. Ranking compares only identical configuration keys. Proposed ordering: score descending, completion timestamp ascending, then match ID lexicographically. Each completed match has one ranking entry, rather than only a player's personal best.

Proposed REST contracts:

| Operation | Contract |
| --- | --- |
| Ranking | `GET /api/ranking?configurationKey=…&page=1&pageSize=10` |
| Player history | `GET /api/players/:playerId/matches?page=1&pageSize=10` |
| Register result | `POST /api/matches` with the immutable completed record; `matchId` is the idempotency key |

Paginated responses contain `items`, `page`, `pageSize`, and `totalItems`. POST returns the canonical existing record on an identical retry; a conflicting payload with the same ID returns a typed conflict. Ranking and history read the same confirmed match store, preventing partial registration.

Persist a local outbox before POST, and remove an item only after confirmation. Failed or ambiguous requests leave it pending. Retry uses the same match ID and payload, including after refresh. A timeout after server-side storage must recover the existing record, never create another. Starting another match never clears the outbox. Retry transient failures with bounded backoff; validation errors require a visible explanation rather than endless automatic retries.

Use Axios for HTTP and TanStack Query for paginated reads and registration mutations. Query keys include all filters and pagination. Refetch tabs when shown and invalidate both collections after registration; cancel obsolete requests or isolate them by key so late responses cannot replace current filters or newer results.

## 13. Technical design boundaries

| Responsibility | Required owner |
| --- | --- |
| Menus, forms, dialogs, semantic status, network panels | React |
| Arena, ships, projectiles, effects, overhead health | PixiJS |
| Rules, movement, damage, collision, AI, spawns | Candidate-written TypeScript simulation |
| Remote state and mutations | TanStack Query + Axios |
| Simulated REST boundary | MSW in development, tests, and published build |
| E2E and visual regression | Playwright |

Use strict TypeScript. Proposed simulation uses a fixed 1/60-second step and elapsed active time, with bounded catch-up to avoid runaway work on a stalled frame. Hidden tabs pause instead of catching up. React subscribes to discrete game events or throttled status snapshots rather than every frame. Render interpolation may smooth visuals without affecting authoritative rules.

Load and cache shared textures before entering combat. An asset failure stays on a recoverable loading screen. Resize the renderer for CSS size and device density while preserving logical-world transforms and pointer mapping. Teardown must release owned listeners, ticker subscriptions, input state, timers, audio, entities, and rendering resources; shared textures need an explicit ownership policy. Verify repeated mount/unmount under React Strict Mode.

MSW scenarios must reproduce success, empty lists, multiple pages, slow and variable latency, out-of-order responses, timeout, connection errors, 4xx/5xx, per-tab failures, timeout after commit, and end-of-match outage followed by recovery. Provide a documented scenario selector and reset action. Resetting mock demo data must not silently affect an active battle. Seed fixtures and latency for reproducible tests. Confirmed data and the outbox survive refresh.

## 14. Acceptance and validation

The following are delivery acceptance checks, not claims of completed testing.

| Area | Required evidence |
| --- | --- |
| Options | Validation, Save/Cancel, refresh persistence, configuration snapshot behavior |
| Assets | Visible loading, simulated failure, successful retry |
| Navigation | R toggles once per press, mouse-follow steering and dead zone, finite turn speed, mobile joypad and cruise behavior, travessia regional, colisão com ilhas |
| Combat | Q front, W left, E right; simultaneous steering/fire, independent cooldowns, damage once, single-point scoring |
| Enemies | Both archetypes, obstacle navigation, safe spawns, configured cadence |
| Lifecycle | End by time/death, terminal freeze, complete replay reset |
| Pause | Manual, blur, hidden tab, explicit resume, auto-sail disabled, no queued movement/fire or time/cooldown advance |
| Persistence | Last completed result, abandoned run exclusion, pending record recovery |
| Touch / UI | Independent joypad/attack pointers, pointer cancellation, R state, desktop bottom-center health/skills, mobile top-center health and left/right controls, cooldown display, resize, keyboard focus and dialogs |
| Data | Pagination, loading/empty/error/background refresh, both views updated after registration |
| Consistency | Timeout-after-commit retry without duplicates, late responses cannot overwrite current data |
| Resource lifecycle | Repeated navigation and Strict Mode without stale listeners or duplicate loops |

Execute main flows in Chromium desktop and mobile. Version visual baselines for the menu, a stable seeded battle state, and the result. Each test starts from isolated storage and fixtures. A test clock may advance the real simulation; combat tests must operate actual controls and observe actual collisions and rendering rather than directly granting kills or scores. Publish an HTML report and traces for failures.

Performance target: 60 FPS in an optimized build on a documented reference environment. Profile a three-minute match and record FPS, p95 frame interval, and live entity counts. Inspect memory and resources after five start/play/exit cycles, investigating sustained growth. Include hardware, browser, resolution, configuration, scenario, and limitations. The one-second spawn setting is an additional proposed stress case; do not claim a device-independent FPS guarantee.

## 15. Delivery sequence and estimate

**Preliminary planning estimate:** 10–15 full working days for one developer familiar with the stack, including mandatory integrations, tests, profiling, and deployment. This is a planning assumption, not a promised deadline; revise after the first playable prototype and asset integration.

| Milestone | Exit condition |
| --- | --- |
| 1. Foundation and assets | Typed settings, loading/retry, React/Pixi lifecycle, visible arena |
| 2. Playable loop | Player controls, three weapons, collisions, both enemies, scoring, end/replay |
| 3. Experience | Menus, touch, pause/focus handling, feedback, accessibility, persistence |
| 4. Data reliability | MSW, contracts, paginated tabs, idempotent registration, persistent outbox, failure scenarios |
| 5. Delivery validation | E2E, visual baselines, performance evidence, documentation, public deployment |

Before completion, supply source, lockfile, assets, mocks, fixtures, tests, reports, and a working public URL matching the delivered code. README must cover clean setup, development/build/preview/lint/typecheck/Playwright commands, controls, gameplay settings, network scenarios/reset, and failure reproduction. ARCHITECTURE must cover simulation, collision, React/Pixi integration, lifecycle, persistence, contracts, cache, and pending recovery. Verify direct loads and refreshes on the deployment, including MSW startup.

## 16. Playtest questions and remaining decisions

- Do front and broadside attacks each create useful opportunities, or does holding all fire buttons dominate? Tune cooldowns, range, and placement before adding mechanics.
- Are Chasers avoidable on touch controls, especially after multiple spawns? Measure early deaths and unsafe materializations.
- Can players reliably read all three ship roles and damage states at portrait scale? Finalize verified sprite mappings and HUD size after the visual pass.
- Do island routes produce tactical repositioning without trapping the player or AI? Validate both hull sizes against every corridor.
- Does the default session create pressure without saturation? Measure time to first kill, score distribution, causes of death, and peak live enemies in manual playtests; no analytics service is required.
- Confirm asset provenance/licensing and final reference devices before release. Numerical balance, map geometry, and sprite choices remain proposals until these checks are complete.
