# Implementation Plan: Catalog Experience Upgrade

## Overview

Deliver the five independently testable capability groups in
`CAPABILITY_MAP.md`, preserving the existing dual API adapters and local
fallback behavior.

## Architecture Decisions

- Keep query caching in a small shared helper rather than adding a new
  dependency; the repository has no server-state library.
- Use the existing `catalog` query parameter for deep links and centralize
  parsing in application navigation.
- Keep draft/archive storage helpers local and expose service-backed catalog
  mutations through the existing `gunService`.
- Normalize `images` to an ordered array while retaining `image_url`/`image`
  compatibility.
- Keep review mutations in `reviewService` and add a single hook-level refresh
  path so UI state does not duplicate API logic.

## Task List

### Phase 1: Foundation

- [ ] Task 1: Add cache and catalog normalization contracts
- [ ] Task 2: Add deep-link share navigation

### Checkpoint: Foundation

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Share URL opens the selected catalog

### Phase 2: Lifecycle and interaction slices

- [ ] Task 3: Complete catalog cards with share/archive controls
- [ ] Task 4: Add Profile hub, drafts, archives, and edit-profile view
- [ ] Task 5: Add review ownership actions and reactions
- [ ] Task 6: Add multi-image create/edit/gallery flow

### Checkpoint: Core Features

- [ ] All five capability groups are reachable from the UI
- [ ] Cache invalidates after catalog mutations
- [ ] Invalid uploads and failed mutations show explicit feedback

### Phase 3: Verification and polish

- [ ] Task 7: Validate lazy loading, cache behavior, responsive UI, and build

### Checkpoint: Complete

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Manual browser/network verification completed
- [ ] No unrelated files changed

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Backend lacks new archive/reaction/image fields | High | Normalize optional fields and isolate local fallback; surface API errors |
| Query cache serves stale mutations | Medium | Invalidate by resource after every write |
| Share URL points to a local-only record | Medium | Show a clear not-found state and preserve local catalog fallback |
| Multiple base64 images grow local/API payloads | Medium | Prefer uploaded URLs, retain client validation and existing size limits |
| Existing state navigation conflicts with deep links | Medium | Parse query only at app entry and keep current state navigation intact |

## Open Questions

See `SPEC-catalog-upgrade.md`.
