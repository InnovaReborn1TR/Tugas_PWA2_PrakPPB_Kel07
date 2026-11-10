# Spec: Catalog Experience Upgrade

## Objective

Improve the PWA catalog experience so users can share one catalog directly,
load catalog media progressively, reuse cached API results, manage their own
drafts and archived catalogs from Profile, manage their own reviews, react to
other users' reviews, and attach more than one image to a catalog.

The existing React/Vite application must continue to support both the Supabase
REST adapter and the university REST API adapter. Existing local fallback
catalog behavior must remain available when the server cannot be reached.

## Capability scope

### Catalog performance
- Catalog card images use native lazy loading and stable dimensions to avoid
  layout shift.
- Catalog list and detail queries use a small in-memory cache with a bounded
  freshness window.
- A repeated query within the freshness window returns cached data without a
  duplicate network request.
- Cache invalidates after create, update, archive/restore, or permanent delete.

### Sharing
- Each catalog detail and card action exposes an accessible Share button.
- When Web Share is supported, it shares the catalog name and URL.
- Otherwise, the URL is copied to the clipboard with visible feedback.
- The URL contains the catalog identifier and opening it displays that catalog
  directly, including a safe not-found/error state for invalid identifiers.
- Existing navigation state remains usable when no share query is present.

### Profile hub and catalog lifecycle
- About and Contact are no longer top-level navbar items; their content is
  available as sections within Profile.
- Profile exposes a list of saved local drafts with resume and delete actions.
- Profile exposes archived catalogs with restore and permanent-delete actions.
- Archive hides a catalog from the active catalog list without destroying it.
- Permanent delete requires confirmation and removes the archived record.
- Profile editing is moved to a dedicated edit-profile view/modal opened by an
  Edit Profile button; the profile summary remains read-focused.

### Reviews
- The current user can edit and permanently delete reviews they created.
- Reviews created by other users show like and dislike controls.
- Each review displays current reaction counts and the current user's selected
  reaction; selecting the same reaction again removes it.
- Review mutations refresh or update the visible list and surface errors.

### Catalog media
- Create and edit forms accept multiple image files.
- Each file is validated using the existing type and size limits.
- Upload progress/errors are visible and one failed upload does not silently
  report success for the whole operation.
- Catalog data preserves an ordered image list while retaining the existing
  single-image field as a backward-compatible fallback.
- Cards use the first image; detail view exposes the complete image gallery.

## Tech Stack

- React 19 with Vite
- JavaScript modules (`.js`, `.jsx`)
- Axios API client
- Supabase REST or university REST API selected by `src/config/api.js`
- Native browser APIs for Web Share, Clipboard, localStorage, and lazy image
  loading
- Existing `lucide-react` icon library and CSS design tokens

## Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

The repository currently has no configured test script. New pure helpers should
remain isolated and be covered by the available project validation; browser
flows require a manual/devtools check until a test runner is introduced.

## Project Structure

```text
src/App.jsx                     application navigation and deep-link handling
src/components/                shared and catalog presentation components
src/pages/                     catalog, create/edit, and profile views
src/hooks/                      API-backed React state hooks
src/services/                   API adapters and upload/review services
src/utils/                      share, draft, archive, and cache helpers
src/data/                       local fallback catalog
src/*.css                       existing design system and responsive styles
```

## Code Style

Use the existing functional React style, named handlers, and explicit empty,
loading, and error states. Reuse existing service and storage helpers instead
of embedding API calls in presentation components.

```jsx
<button
  type="button"
  className="btn btn--outline"
  onClick={handleShare}
  aria-label={`Share ${gun.name}`}
>
  <Share2 size={16} /> Share
</button>
```

Use ASCII source text by default, existing CSS tokens/classes, and no broad
catch blocks that hide failures. Keep backward-compatible normalisation in
`gunService` for API payload differences.

## Testing Strategy

- Unit-level pure behavior: cache freshness/invalidation, share URL parsing,
  draft/archive list transformations, and review reaction state.
- Service-level behavior: verify request payloads and normalized multi-image
  responses using deterministic fakes where possible.
- Browser-level manual verification: open a catalog share URL, verify the
  target catalog, inspect Network for progressive image loading, reload and
  verify repeat queries/images use cache, and exercise Profile/review/media
  flows at mobile and desktop widths.
- Run `npm run lint` and `npm run build` after each coherent implementation
  slice and before completion.

## Boundaries

- Always: preserve local fallback behavior, validate uploads, show mutation
  errors, use accessible buttons/labels, invalidate stale cache after writes,
  and keep existing API adapters working.
- Ask first: adding runtime dependencies, changing the backend schema or
  authentication model, changing the API base URL, or changing the meaning of
  permanent deletion.
- Never: commit `.env` or credentials, edit `node_modules`/build output,
  silently discard existing drafts/catalogs, or remove failing validation to
  make a build pass.

## Success Criteria

1. A Share action on any catalog produces a URL that opens that exact catalog.
2. Catalog images are requested progressively as cards become visible, and
   repeated catalog queries reuse a fresh cache entry.
3. Profile contains About, Contact, Drafts, Archives, and an Edit Profile
   entry point; archived items can be restored or permanently deleted.
4. Users can edit/delete only their own reviews; other reviews expose working
   like/dislike state and counts.
5. Create/edit catalog accepts multiple valid image files and detail view shows
   the ordered image set while old single-image records still render.
6. `npm run lint` and `npm run build` pass, with no new console errors in the
   verified browser flows.

## Open Questions

- Does the deployed backend already expose columns/endpoints for `images`,
  archive state, and review reactions? If not, the first implementation should
  use the existing persistence capabilities and a clearly isolated local
  fallback, while documenting the required backend contract.
- Should archive visibility be per-user or global? The safe default is
  ownership-scoped for user-created catalogs and non-destructive local state
  for fallback records.
- Should a shared URL open the catalog in the current SPA only, or also be
  supported after a hard reload on a deployed static host? The proposed query
  parameter approach supports both.
