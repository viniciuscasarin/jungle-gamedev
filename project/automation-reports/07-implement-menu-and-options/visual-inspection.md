# Menu and Options visual inspection

Reviewed on 2026-10-28 by `/root/i07_apply_finish`, using `view_image` to open
the existing full-page Chromium captures individually. No screenshots were
regenerated or altered during this review. Source: `browser-evidence/dev-*.png`
in this directory; the same images are attached to the completed Playwright report.

## Viewport matrix

Each row was opened at desktop 1280×900, portrait 320×568 and landscape 844×390.
Suffixes are `desktop`, `320` and `landscape` respectively.

| Capture prefix after `dev-` | Observed result |
| --- | --- |
| `menu-empty-` | Title, control guide, Play and Options readable; future features explicitly unavailable; no Last Result. |
| `menu-last-result-options-` | Last Result fits as a separate action without covering guide or future-feature explanation. |
| `options-valid-` | Both labels, seconds, limits, values, Save and Cancel readable; keyboard field focus visible. |
| `options-invalid-` | Both inline errors readable, invalid outlines visible, disabled Save distinct; Cancel reachable. |
| `options-recovery-` | Recovery explanation wraps inside panel; defaults 120/3, help and actions remain legible. |
| `options-write-failure-` | Saved-failure alert and edited 180/10 values visible; Save and Cancel remain separate and usable. |

Across these 18 images, panel corners/borders retain their shape while the center
extends with content. Main buttons preserve their aspect ratio and text sits in
their label areas. No clipped title, missing action, text overlap or horizontal
overflow was observed. At 320px and short landscape height the document is taller
than the viewport: vertical scrolling is intentional. Full-page captures show
all content; the E2E `layouts` helper independently asserts document scroll width
equals viewport width. CSS uses safe-area insets; these desktop captures do not
simulate a physical device notch.

The landscape background stops at the initial viewport and the continued page
uses the dark CSS surface. This remains decorative and does not reduce content
contrast or change the panel geometry. The 320px future-feature explanation has
tight margins but remains readable and contained.

## Button states and image fallback

Opened `dev-primary-hover.png`, `dev-primary-pressed.png`,
`dev-primary-disabled.png`, `dev-secondary-focus.png` and
`dev-secondary-pressed.png`. Primary brightness/depression/disabled artwork is
distinct; Save and Cancel text remains legible. The keyboard focus outline is
visible around the respective controls. Secondary normal artwork is visible in
the matrix and focus image; pressed remains secondary. E2E also asserts the
actual CSS asset URLs for primary hover/pressed/disabled and secondary
normal-on-hover/pressed. No secondary primary-state leak was observed.

Opened `dev-menu-image-fallback.png` and `dev-options-image-fallback.png`.
With DOM images blocked, title text, panel surface, field labels/help and action
labels remain readable. E2E subsequently reaches Arena, proving the missing DOM
art does not become a required Pixi load failure.

## Dev and preview consistency

Recomputed SHA-256 for the 23 existing paired labels in `visual-comparison.json`:
all current dev/preview files match both the recorded hashes and each other.
`visual-comparison-recheck.json` records 23 labels, zero failures. Thus the 18
matrix captures and five explicit button-state captures reviewed here also match
the completed preview run byte for byte. The two fallback images were visually
reviewed from dev; fallback functionality passed in both projects.

Evidence is headless Chromium with touch enabled, not a physical-device or
screen-reader certification. The full run reports 44 passed (8.1m); see `e2e.log`,
`test-results/.last-run.json` and `playwright-report/index.html`. Its original
process exit code was not preserved across executor interruption; no exit code
is inferred from the report.
