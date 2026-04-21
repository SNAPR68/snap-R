## Studio UI Architecture

`components/studio-client.tsx` — Main editing interface (~800 lines, monolithic client component):

**Layout:** Header → MarketingBanner → 3-column flex (AI Tools sidebar | Canvas | Downloads/Marketing panel)

**Key state:**
- `listingStatus` — preparation status + confidence
- `marketingListingStatus` / `marketingJobData` — marketing pipeline status (polled every 5s)
- `showMarketingPanel` — swaps right sidebar from Downloads to Marketing Results
- `pendingEnhancement` — before/after slider for AI edits
- `completedPhotos` — enhanced photos ready for download

**Marketing UI components:**
- `components/marketing-banner.tsx` — Context-aware banner below header (processing/completed/failed states)
- `components/marketing-results-panel.tsx` — Right sidebar swap showing all 5 marketing artifacts with copy buttons

## Enhancement Tools (15 in studio, 23 total)

Exterior: sky-replacement, virtual-twilight, lawn-repair, pool-enhance
Interior: declutter, virtual-staging, fire-fireplace, tv-screen, lights-on, window-masking
Enhance: hdr, auto-enhance, perspective-correction, lens-correction, color-balance

Each tool has presets (e.g., sky-replacement: Clear Blue, Sunset, Dramatic Clouds, Twilight Sky).

