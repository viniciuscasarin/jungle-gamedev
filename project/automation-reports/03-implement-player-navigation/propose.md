# Propose report — implement-player-navigation

Completed on 2026-10-27 by `/root/i03_propose`. Planning only; no product code, main specification, automation state, prior evidence, dependency, or test implementation was changed. The project OpenSpec propose skill was used. The automation's explicit authorization permits the orchestrator to start apply in a fresh agent after this phase ends.

## Inputs and observed baseline

Read the project propose skill, automation authorization/state, increment03 explore handoff, common prompt and increment03, GDD sections4/5/8/13/14, OpenSpec config and all five main capabilities. Inspected configuration/contracts, immutable snapshot support, App, Pixi resource, owner/loading wrapper responsibilities, viewport/resize behavior, existing tests and E2E output paths, architecture, scripts and core isolation rules. No AGENTS.md was found. Existing untracked work from increments01/02 was preserved.

The common context and increment03 were extracted by section boundary; no increment04 or later prompt was loaded. An initial bounded read also included the already completed01/02 prompt text. The source statement that no implementation exists is historical; actual archived/spec/code state was used.

The CLI resolved the local repository root and default `spec-driven` schema, with no active change before creation. Five main capabilities exist. The static UI/rendering requirements conflict with the intended increment03 behavior and are explicitly updated by deltas; configuration and simulation contract requirements remain compatible, including side-effect-free imports.

## Artifacts

Change root: `openspec/changes/implement-player-navigation/`.

- `.openspec.yaml`: CLI-created default schema declaration.
- `proposal.md`: scope, impact, two new and two modified capabilities.
- `design.md`: architecture, local decisions, test/evidence strategy, risks and sync handoff.
- `specs/simulation-runtime/spec.md`: four new requirements for deterministic execution, fixed-step recovery, snapshots and frozen time.
- `specs/player-navigation/spec.md`: seven new requirements covering steering, coordinate invariance, R, collision, input ownership, focus freeze and diagnosis.
- `specs/application-shell/spec.md`: complete modified accessible-shell requirement, preserving existing loading/narrow-view scenarios and adding Resume.
- `specs/arena-rendering/spec.md`: rename of the static composition requirement plus complete modified content, retaining map/shoreline scenarios and adding authoritative presentation.
- `tasks.md`:18 unchecked implementation/verification tasks; workflow sync/archive steps remain untracked follow-up bullets.

All required schema artifacts were created, including design because runtime/input/render/UI integration and collision have cross-module complexity. No conditional artifact was skipped.

## Decisions for apply

- Reuse existing immutable setup, contracts, arena-v2 65-vertex island outlines, typed units, speed150, turnπ, radius18, dead zone12 and catch-up5. These remain initial tuning values, not playtest claims.
- Pure simulation plus pure explicit-delta accumulator; step count determines active time. Drop excess whole steps after saturation, retain only fractional remainder. Keep first-frame and Resume baselines clean.
- One owned RAF starts at mount; Pixi ticker remains stopped. Preserve delayed-init/Loading ownership and propagate resource extensions through wrappers. React updates only discrete semantic state.
- Mouse coordinates use client origin and current CSS transform with clamp; stored logical target survives resize/DPR and pointerleave. Steering turns before forward translation, with deterministic positive-arc tie atπ.
- R uses latch plus pending-edge queue, ignoring repeat/duplicates and consuming one accepted pressure once per step. Exclude modified shortcuts, editable fields and interface controls from capture.
- Swept circle against actual polygon segments/vertices and inset world bounds, earliest impact and tangential projection, deterministic ordering, finite iterations and valid-position fallback. Document numerical epsilon/tolerance independently from artistic shoreline tolerance.
- Blur/hidden freeze immediately, disable auto-sail and clear keys/edges/target/baseline; focus alone does not resume. HTML Resume retains heading, restores game focus and still requires new R for movement. Full session lifecycle stays out of scope.
- Diagnostics remain read-only and show real hull/shoreline/bounds/heading. Browser evidence must operate mouse/R around all four sides of both islands without teleport/setters.
- E2E reporter, screenshots and outputs must move to directory03 before execution, preserving02. Include dev Strict Mode, preview, five cycles, focus/hidden, resize/DPR and320px visual inspection.
- During later authorized sync, also update the existing arena-rendering Purpose to remove the obsolete static qualifier; no main-spec edit was made during propose.

## Commands and results

Each shell prepended the verified Node26.11.1 install to process-local PATH and used `.cmd` entrypoints. No global runtime switch or installation occurred.

| Command | Exit | Result |
| --- | --- | --- |
| `node --version` |0|v26.11.1|
| `openspec.cmd --version` |0|1.14.1|
| `openspec.cmd list --json` before creation |0|Valid local root; changes empty|
| `openspec.cmd context --json` |0|Authoritative repository root resolved|
| `openspec.cmd list --specs` |0|Five existing capabilities|
| `openspec.cmd show <application-shell/arena-rendering/simulation-contracts> --type spec --json --no-scenarios` |0 each|Capability inventory corroborated; full spec files also read|
| `openspec.cmd new change implement-player-navigation` |0|Change created with default schema|
| `openspec.cmd instructions <proposal/specs/design/tasks> --change implement-player-navigation --json` |0 each|Schema templates, paths and dependencies read before authoring|
| `openspec.cmd status --change implement-player-navigation --json` after each artifact |0 each|Final planning complete, all four artifact classes done|
| `openspec.cmd validate implement-player-navigation --strict` |0|Change valid, no validation warning|
| `openspec.cmd status --change implement-player-navigation` |0|4/4 artifacts complete|
| `openspec.cmd instructions apply --change implement-player-navigation --json` |0|Read-only readiness check: state ready,18 total,0 complete,18 remaining|
| `openspec.cmd list --json` after planning |0|Only implement-player-navigation active, no completed task|

Evidence: `propose-status.json` and `propose-validation.txt` in this report directory. CLI status reports planning completeness, not implemented behavior. Files were read back from disk before dependent artifacts and final task generation.

## Limitations and handoff

No build, product tests or browser interaction were run in this planning-only phase; those checks are explicitly assigned to apply and independent verify. No blocker or material unresolved product decision remains. Solver numerical constants may be refined only against evidence while preserving non-penetration/sliding requirements. Browser loopback/teardown permission and executable selection remain environment checks for the implementing agent.

All artifacts needed for implementation are ready. The orchestrator can immediately start a fresh apply agent with this change, design,18 pending tasks and existing explore report. Do not archive before all behavior, evidence and independent verify pass; do not push or deploy.
