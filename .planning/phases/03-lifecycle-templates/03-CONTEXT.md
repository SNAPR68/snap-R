# Phase 3 Context: Lifecycle Templates

## What We Have

- PropertyShowcase composition (Phase 2) — crossfade slideshow with Ken Burns, address overlay, closing card
- ClosingCard component — reusable staggered fade-in for address, gold price, beds/baths/sqft
- 3 aspect ratio registrations per template (9:16, 1:1, 16:9) in Root.tsx
- Photo ordering module using AI room classification
- Generate route with composition ID mapping (`getCompositionId()`)
- VideoCreator UI with aspect ratio selector, no template selector yet
- `@remotion/transitions` installed with slide, wipe, flip, clockWipe available
- `marketing_status` column on listings: 'Active', 'Just Listed', 'Open House', 'Price Reduced', 'Under Contract', 'Sold'
- Social template categories already defined: just-listed, open-house, etc.
- No `open_house_date` column exists — will use string prop passed from UI or fallback

## Phase 3 Requirements

- COMP-02: JustListed template with intro card, photo slideshow, feature callouts, end card
- COMP-03: OpenHouse template with date/time urgency, fast-paced slideshow
- COMP-08: Transitions supported: fade (default), slide, zoom/Ken Burns — selectable per video
- UI-03: Template selector dropdown with preview thumbnails

## Key Decisions

1. **Shared components**: Extract reusable pieces from PropertyShowcase (PhotoSlide, AddressOverlay) into shared module
2. **Intro card pattern**: New component for animated text intros ("JUST LISTED", "OPEN HOUSE")
3. **Feature callouts**: Overlay listing features (from `features` field) during slideshow
4. **Transition variety**: JustListed uses slide transitions, OpenHouse uses faster wipe/slide for urgency
5. **Duration**: JustListed slightly longer (adds intro + feature callouts), OpenHouse slightly shorter (urgency pacing)
6. **Template selector**: Add to VideoCreator UI — 3 cards with template name + brief description
7. **Open house date**: Pass as optional string prop from UI input field; not stored in DB yet
