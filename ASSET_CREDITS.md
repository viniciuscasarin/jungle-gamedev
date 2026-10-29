# Asset Credits, Provenance & Licensing Matrix

This document provides the exhaustive inventory, provenance audit, and legal licensing status for all assets, procedural geometries, and software dependencies in **Pirate Battle 2D**, in strict compliance with Section 15 ("Delivery sequence and estimate") and Section 16 ("Playtest questions and remaining decisions") of [GDD.md](GDD.md).

> **Regulatory Rule (GDD §15):**  
> *"Licença sem comprovação continua pendente e não é presumida."*  
> (License without proof remains pending and is not presumed).

---

## 1. Exhaustive Repository Asset Inventory (`assets/`)

The repository contains exactly **520 files** in the `assets/` directory. None of the files in `assets/` were altered, recompressed, converted, or deleted during development.

### Complete Directory Breakdown

| Directory Path | Total Files | File Types | Description |
| --- | --- | --- | --- |
| `assets/` (root) | 10 | 1 SVG, 9 PNG | Background mockup, reference preview compositions, and vector root files |
| `assets/png/` | 468 | 468 PNG | Graphical sprites divided equally into default (1×) and retina (2×) resolutions |
| `assets/png/default/` | 234 | 234 PNG | Baseline 1× graphics: `effects/` (5), `ships/` (30), `ship_parts/` (67), `tiles/` (96), `ui/` (36) |
| `assets/png/retina/` | 234 | 234 PNG | High-density 2× graphics: matching mirrors for all default assets |
| `assets/sounds/` | 27 | 27 WAV | Comprehensive collection of game sound effects and ambient loops |
| `assets/spritesheet/` | 8 | 4 PNG, 2 XML, 2 JSON | Pre-packed texture atlases and metadata descriptors |
| `assets/tilesheet/` | 3 | 2 PNG, 1 TXT | Terrain tilesheet textures and index reference file |
| `assets/vector/` | 4 | 2 SVG, 2 SWF | Original scalable vector and Adobe Flash artwork assets |
| **Total Inventory** | **520** | **520 files** | **100% accounted for** |

---

## 2. Active Runtime Asset Subset

The live game application consumes a carefully verified subset of the assets: exactly **52 unique images** (33 core PixiJS combat textures + 19 DOM UI images) and **27 audio sound effects**.

### 2.1 Core Combat Textures (33 Images — Loaded into PixiJS)

Cataloged in `src/render/assetManifest.ts` (`ASSET_MANIFEST` / `ASSET_URLS`). These are required for the arena simulation and are loaded and cached before entering gameplay:

| Category | Role | File Path (relative to `assets/`) | Physical / Logical Size |
| --- | --- | --- | --- |
| **Projectile** | Cannonball | `png/default/ship_parts/cannon_ball.png` | 10×10 px / 10×10 units |
| **Ships** | Player Vessel | `png/default/ships/ship_5.png` | 66×113 px / 66×113 units |
| | Chaser Enemy | `png/default/ships/ship_3.png` | 66×113 px / 66×113 units |
| | Shooter Enemy | `png/default/ships/ship_8.png` | 66×113 px / 66×113 units |
| **Shoreline Tiles** | North / South Shore | `png/default/tiles/tile_6.png`, `tile_7.png`, `tile_8.png`, `tile_9.png` | 64×64 px each |
| | East / West Shore | `png/default/tiles/tile_22.png`, `tile_23.png`, `tile_24.png`, `tile_25.png` | 64×64 px each |
| | Corners / Insets | `png/default/tiles/tile_54.png`, `tile_55.png`, `tile_56.png`, `tile_57.png` | 64×64 px each |
| **Interior Tiles** | Sand & Grass Fill | `png/default/tiles/tile_38.png`, `tile_39.png`, `tile_40.png`, `tile_41.png` | 64×64 px each |
| **Water & Props** | Open Sea Water | `png/default/tiles/tile_73.png` | 64×64 px |
| | Rock Obstacle | `png/default/tiles/tile_49.png` | 64×64 px |
| | Palm Tree 1 | `png/default/tiles/tile_70.png` | 64×64 px |
| | Palm Tree 2 | `png/default/tiles/tile_72.png` | 64×64 px |
| **VFX Explosions** | Blast Frame 1 | `png/default/effects/explosion_1.png` | 74×75 px |
| | Blast Frame 2 | `png/default/effects/explosion_2.png` | 60×59 px |
| | Blast Frame 3 | `png/default/effects/explosion_3.png` | 42×41 px |
| **VFX Deck Fire** | Fire Flame Frame 1 | `png/default/effects/fire_1.png` | 18×39 px |
| | Fire Flame Frame 2 | `png/default/effects/fire_2.png` | 11×27 px |
| **Debris Particles**| Hull Splinter 1 | `png/default/ship_parts/wood_1.png` | 15×7 px |
| | Hull Splinter 2 | `png/default/ship_parts/wood_2.png` | 26×10 px |
| | Hull Splinter 3 | `png/default/ship_parts/wood_3.png` | 15×10 px |
| | Hull Splinter 4 | `png/default/ship_parts/wood_4.png` | 26×7 px |

*Subtotal: 1 projectile + 3 ships + 20 terrain/sea tiles + 5 visual effects + 4 wood debris = **33 PixiJS combat textures**.*

### 2.2 DOM UI Images (19 Images — Rendered via React HTML/CSS)

Cataloged in `src/render/assetManifest.ts` (`DOM_ASSET_IDS`). These decorative elements are decoupled from the PixiJS canvas so that decorative asset delays or failures never block combat initialization:

| Category | Asset Role | File Path (relative to `assets/`) | Dimensions |
| --- | --- | --- | --- |
| **Menu Backdrop** | Fullscreen Canvas | `ui_scene_background.png` | 918×515 px |
| **Menu Panel** | Border-Image Frame | `png/default/ui/menu/panel_menu.png` | 384×480 px |
| **Menu Title** | Header Logo | `png/default/ui/menu/title_pirate_battle.png` | 384×128 px |
| **Primary Button** | Normal / Hover | `png/default/ui/menu/button_primary_normal.png`, `..._hover.png` | 256×88 px each |
| | Pressed / Disabled | `png/default/ui/menu/button_primary_pressed.png`, `..._disabled.png` | 256×88 px each |
| **Secondary Button**| Normal / Pressed | `png/default/ui/menu/button_secondary_normal.png`, `..._pressed.png` | 256×88 px each |
| **HUD Cannon Icons**| Front Cannon (Q) | `png/default/ui/controls/icon_fire_front.png` | 48×48 px |
| | Port Broadside (W) | `png/default/ui/controls/icon_fire_left.png` | 48×48 px |
| | Starboard Broadside (E) | `png/default/ui/controls/icon_fire_right.png` | 48×48 px |
| **HUD Nav Icons** | Forward Auto-Sail (R) | `png/default/ui/controls/icon_forward.png` | 48×48 px |
| | Pause Button | `png/default/ui/controls/icon_pause.png` | 48×48 px |
| **Round Buttons** | Normal / Hover / Pressed | `png/default/ui/controls/button_round_normal.png`, `..._hover.png`, `..._pressed.png` | 64×64 px each |
| **HUD Health** | Frame / Green Fill | `png/default/ui/hud/health_frame.png`, `health_fill_green.png` | 256×48 px each |

*Subtotal: 9 menu assets + 5 HUD icons + 3 round buttons + 2 health bar assets = **19 DOM UI images**.*  
*Total Runtime Visual Assets: 33 + 19 = **52 images**.*

### 2.3 Audio Sound Effects (27 WAV Files)

Cataloged in `src/audio/audioManifest.ts` (`AUDIO_MANIFEST`). All 27 sound files present in `assets/sounds/` are actively used in runtime:

| Category | Files | Role in Game Audio Runtime |
| --- | --- | --- |
| **Ambience** | `ocean_ambience_loop.wav` | Looping environmental sea wind and waves |
| **Navigation** | `ship_sailing_loop.wav` | Dynamic movement loop active during propulsion |
| **Weapon Fire** | `cannon_fire_1.wav`, `cannon_fire_2.wav`, `cannon_fire_3.wav`, `cannon_broadside.wav` | Front cannon shot variations and triple broadside volley |
| **Impacts** | `ship_wood_hit_1.wav`, `ship_wood_hit_2.wav`, `cannonball_water_hit_1.wav`, `cannonball_water_hit_2.wav`, `ship_collision.wav` | Hull penetration, water splashes, and shoreline bump |
| **Destruction** | `ship_explosion_1.wav`, `ship_explosion_2.wav`, `ship_sinking.wav`, `score_point.wav` | Vessel explosions, sinking audio, and kill score reward |
| **Warnings** | `health_low.wav`, `time_warning.wav` | Low health pulse (≤25 HP) and final 10s countdown alert |
| **UI Clicks** | `ui_hover.wav`, `ui_click.wav`, `ui_open.wav`, `ui_close.wav`, `ui_back.wav` | Interactive button interactions, modal open/close/cancel |
| **Session Marks**| `game_start.wav`, `game_pause.wav`, `game_resume.wav`, `game_complete.wav`, `game_over.wav` | Match state transitions and terminal victory/defeat marks |

---

## 3. Legal Status of Third-Party Challenge Assets

### Documental Audit Finding

- **Source**: All 520 files in `assets/` were delivered as part of the initial coding challenge repository.
- **Documentation**: The challenge archive did not include an author specification, copyright notice, license grant, or terms of redistribution.
- **No Inferred Attribution**: While visual and auditory styles share similarities with popular public game asset packs (such as Kenney Pirates / Nautical Packs), **no license (such as CC0 1.0 or MIT) has been assumed or inferred**.

### Formal Legal Classification (GDD §15 Compliance)

All 520 files in `assets/` are classified as:

$$\mathbf{Status:}\;\text{Pending Third-Party License Verification / Documental Confirmation}$$  
*(Pendente de Homologação de Licença pelo Titular dos Direitos)*

Before any commercial distribution or public release outside the scope of this technical evaluation, the copyright holder or challenge issuer must provide the formal license documentation or assignment.

---

## 4. Authorial Procedural Geometries (PixiJS)

All game geometries and overlays rendered dynamically via PixiJS primitive graphics (`src/render/pixiPreview.ts` and `src/render/battleEffects.ts`) are **100% original authorial code**:

1. **Overhead Health Bars (`bars`)**:
   - Dynamically calculated horizontal rectangular tracks, white border outlines, and green health fill.
   - Preserves player/enemy health visibility independently of ship rotation.
2. **Telegraph Warning Rings (`telegraphs`)**:
   - Expanding procedural concentric water rings (`Graphics.circle().stroke()`) signaling impending enemy spawns.
3. **Shoreline Collision Outlines (`outline`)**:
   - Procedural vector polygons (`Graphics.poly().stroke()`) rendering island solid collision boundaries in geometry mode.
   - Demonstrates physical tangential sliding without penetration.
4. **Collision Debug Overlays (`overlay`)**:
   - Real-time rendering of player/enemy circular hitboxes ($r = 18$ and $r = 14$), cannonball collision points ($r = 5$), heading vectors, and camera bounds.
5. **Floating Score Text & Particle Splinters**:
   - Dynamically instantiated Pixi `Text` and pooled particle sprites transformed at runtime.

**Legal Status**: **Proprietary Authorial Code (Free of third-party copyright or license restrictions)**.

---

## 5. Open Source Software Dependencies Matrix

All third-party software libraries consumed by the project are formally audited, with permissive open source licenses (**MIT** or **Apache-2.0**):

| Package Name | Version | License | Primary Purpose / Runtime Boundary | Source Repository |
| --- | --- | --- | --- | --- |
| `react` | 19.3.1 | **MIT** | UI components, accessible menus, modals, options | [facebook/react](https://github.com/facebook/react) |
| `react-dom` | 19.3.1 | **MIT** | Web DOM renderer for React | [facebook/react](https://github.com/facebook/react) |
| `pixi.js` | 8.22.0 | **MIT** | 2D WebGL/WebGPU arena rendering engine | [pixijs/pixijs](https://github.com/pixijs/pixijs) |
| `@tanstack/react-query`| 5.105.0 | **MIT** | Server state caching, pagination, deduplication | [TanStack/query](https://github.com/TanStack/query) |
| `axios` | 1.21.0 | **MIT** | HTTP client for REST mock API communication | [axios/axios](https://github.com/axios/axios) |
| `msw` | 3.0.3 | **MIT** | Mock Service Worker for REST simulation | [mswjs/msw](https://github.com/mswjs/msw) |
| `vite` | 8.3.5 | **MIT** | Build tool, dev server, and production bundler | [vitejs/vite](https://github.com/vitejs/vite) |
| `vitest` | 5.0.5 | **MIT** | Unit, integration, and benchmark test runner | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) |
| `@playwright/test` | 1.64.1 | **Apache-2.0**| End-to-end and visual regression test framework | [microsoft/playwright](https://github.com/microsoft/playwright) |
| `typescript` | 5.9.3 | **Apache-2.0**| Strict static typing compiler | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) |
| `eslint` | 10.13.0 | **MIT** | Static code analysis and linting | [eslint/eslint](https://github.com/eslint/eslint) |

**Audit Conclusion**: All production and development dependencies are free of copyleft restrictions (no GPL/AGPL) and are fully authorized for redistribution in packaged bundles.

---

## 6. Summary Compliance Statement

| Asset / Component Category | Inventory Count | Licensing Status | Production Bundle Viability |
| --- | --- | --- | --- |
| Supplied Assets (`assets/`) | 520 files | Pending Documentation (GDD §15) | Bundled as local static assets for evaluation |
| Active Runtime Images | 52 files (33 Pixi + 19 DOM) | Pending Documentation (GDD §15) | Fingerprinted and packaged in `dist/assets/` |
| Active Sound Effects | 27 WAV files | Pending Documentation (GDD §15) | Fingerprinted and packaged in `dist/assets/` |
| Procedural Pixi Geometries | Dynamic | Original Authorial Code | 100% Free / Unencumbered |
| Software Dependencies | 11 core packages | MIT / Apache-2.0 Verified | 100% Permissive Open Source |
