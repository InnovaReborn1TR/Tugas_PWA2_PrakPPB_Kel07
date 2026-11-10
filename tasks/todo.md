# Catalog Experience Upgrade Tasks

- [ ] Task 1: Add cache and catalog normalization contracts
  - Acceptance: fresh list/detail queries reuse cache; mutations invalidate it; image arrays normalize with single-image fallback.
  - Verify: focused helper/service checks, `npm run lint`, `npm run build`.
  - Files: `src/services/gunService.js`, `src/hooks/useGuns.js`, `src/utils/`.

- [ ] Task 2: Add deep-link share navigation
  - Acceptance: share action copies or invokes Web Share; `?catalog=<id>` opens the matching detail; invalid IDs show an error state.
  - Verify: browser hard reload and share fallback checks.
  - Files: `src/App.jsx`, `src/utils/share.js`, catalog/detail components.

- [ ] Task 3: Complete catalog cards with share/archive controls
  - Acceptance: cards/details expose accessible share and archive actions; active list excludes archived records; restore path exists.
  - Verify: UI flow and cache invalidation after each mutation.
  - Files: catalog components, `src/services/gunService.js`, archive helper.

- [ ] Task 4: Add Profile hub, drafts, archives, and edit-profile view
  - Acceptance: About/Contact move into Profile; drafts and archives list actionable records; edit form opens separately.
  - Verify: profile flow at mobile and desktop widths.
  - Files: `src/components/Header.jsx`, `src/pages/ProfilePage.jsx`, new profile components/page, styles.

- [ ] Task 5: Add review ownership actions and reactions
  - Acceptance: current user's reviews can be edited/deleted; other reviews can be liked/disliked with counts and toggle state.
  - Verify: review service/hook checks and detail-page flow.
  - Files: `src/services/reviewService.js`, `src/hooks/useReviews.js`, `src/components/gun/GunDetail.jsx`.

- [ ] Task 6: Add multi-image create/edit/gallery flow
  - Acceptance: multiple files validate/upload/persist in order; old records still render; detail gallery is keyboard accessible.
  - Verify: create/edit with 0, 1, and multiple images plus upload failure.
  - Files: create/edit pages, upload service, gun normalizer, detail component, styles.

- [ ] Task 7: Validate performance and release readiness
  - Acceptance: lazy image requests are progressive, repeat queries/images are cached, lint/build pass, no new console errors.
  - Verify: browser DevTools Network and responsive checks.
  - Files: only targeted fixes discovered during verification.

## Checkpoint: After Tasks 1-3

- [ ] Lint and build pass
- [ ] Share/deep-link flow works
- [ ] Active/archived catalog behavior works

## Checkpoint: After Tasks 4-6

- [ ] Profile, review, and multi-image flows work
- [ ] No existing catalog/favorite behavior regressed
