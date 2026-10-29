# Visual inspection — responsive HUD and touch

Inspected with view_image on 2026-10-28. Reference: headless Chromium on Windows,
CSS viewport sizes below, CDP native touch contacts, existing Playwright Chromium
binary. Safe areas are controlled CSS insets (top7, bottom9, left5, right6), not a
physical notch. The full world is proportionally fitted; landscape320 height has a
smaller arena because both HUD bands and48px targets remain reserved.

| Capture (browser-evidence/) | Observation |
| --- | --- |
| dev-hud-desktop-1280x900-ready.png | QWER centered above bottom health; score/time/Pause top; Ready text and icons present; complete world and horizontal ship bars |
| dev-hud-desktop-1280x900-cooldown-Ron.png | Independent0.4s/1.2s fills, explicit R On and player rotated left; no overlap |
| dev-hud-desktop-chaser-half-health.png | Front cannon collision reduces Chaser40→20; half-length horizontal bar |
| dev-hud-desktop-rotated-shooter-damaged.png | Front cannon aimed left reduces Shooter60→40; player hull rotates, health bars stay horizontal |
| dev-touch-four-native-contacts-cooldown.png |390×844, native captured joypad+QWE;7 real projectiles, movement and cooldown |
| dev-hud-touch-320x568-cooldown-Ron.png | Top health, lower-left joypad, lower-right2×2 skills, separated≥48px targets; full world between measured bands |
| dev-hud-touch-390x844-safe-ready.png | Narrow safe-area layout and all controls inside viewport; this label identifies a geometry checkpoint and does not assert every weapon is Ready at that instant |
| dev-hud-touch-844x390-cooldown-Ron.png | Wide short layout uses four skills in one row on right, joypad left; complete arena and unclipped controls |
| dev-hud-touch-568x320-cooldown-Ron.png | Minimum tested height preserves48px targets, health and both bands without cropping or overflow; arena scale decreases |
| dev-hud-player-real-contact-damage-390x844.png | Real Chaser contact reduces player100→75; matching75% overhead and numeric HUD health, surviving Shooter visible |
| dev-hud-player-real-contact-damage-paused-390x844.png | Paused modal, Off, frozen geometry/health; semantic controls remain distinct |
| dev-touch-paused-cooldown-exact.png | Final320px modal fits within viewport after min-width fix; cooldown values/fill stay exactly frozen |

Numeric browser assertions accompany these images: all skill/joypad/Pause/Main Menu
hitboxes are≥48×48CSSpx, pairwise disjoint, within viewport, and document dimensions
match viewport. Arena bounds lie between actual band rectangles; nonzero safe areas
enter only once. Bar geometry is horizontal, clamped to world bounds and at least
24×4CSSpx. Combat-generated damage, deaths and score determine bar values/removal.

A visual issue found during review (grid min-content expanded the Paused panel past
320px) was fixed with min-width:0 and checked through browser rectangles and a new
screenshot. No acceptance criterion was removed. Native pointer proof, exact pause,
mode/resize/DPR, five teardown cycles and preserved menu/options/loading/result
regressions are in the Playwright HTML report and JSON attachments.

No physical handset, physical safe area, other browser engine or hardware FPS claim
is made. No source art was edited or newly inferred; all HUD assets had been visually
inspected in explore and their catalog/default-retina metadata is tested.
