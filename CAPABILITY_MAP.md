# Capability Map: Catalog Experience Upgrade

| Module id | Responsibility | Depends on |
|---|---|---|
| catalog-performance | Lazy-load media, cache API query results, and preserve fast repeat visits | — |
| catalog-sharing | Shareable catalog URLs and deep-link navigation to one catalog | catalog-performance |
| catalog-lifecycle | Draft listing, archive/restore/permanent delete, and ownership-aware catalog actions | — |
| profile-hub | Move About/Contact content into Profile and expose drafts/archives/edit-profile entry points | catalog-lifecycle |
| review-interactions | Edit/delete own reviews and like/dislike other users' reviews | — |
| catalog-media | Upload and persist multiple images per catalog | catalog-performance |

Build order: catalog-performance → catalog-sharing, catalog-lifecycle, review-interactions, catalog-media → profile-hub
