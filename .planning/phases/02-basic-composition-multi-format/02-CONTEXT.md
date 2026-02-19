# Phase 2: Basic Composition + Multi-Format - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the PropertyShowcase video template with photo slideshow, text overlays, Ken Burns motion, and crossfade transitions — rendering correctly in 9:16, 1:1, and 16:9 aspect ratios. Migrate VideoCreator UI from broken browser-FFmpeg to API calls with progress polling and video playback.

</domain>

<decisions>
## Implementation Decisions

### Slideshow Visual Style
- Dark & premium visual feel — dark backgrounds (#0A0A0A), gold accents (#D4A017), matching SnapR's existing dark theme
- 4-5 seconds per photo display time — balanced pace
- Crossfade transitions between photos — classic, elegant
- Slow crossfade (1.5-2 seconds) — dreamy, luxury feel with long overlapping blends
- Subtle Ken Burns effect on all photos — slow zoom/pan for cinematic walkthrough feel
- Video should feel like a property walkthrough tour, not a static slideshow
- Auto duration based on photo count (4-5 seconds per photo) — natural ending
- Closing card at end — fade to dark card with property summary

### Text Overlay Content
- Minimal during slideshow — address only visible throughout the video
- Full details on closing card — address + price + beds/baths/sqft
- Gold accent (#D4A017) on price when displayed (closing card)
- Text always visible during slideshow (address), not fading in/out per photo

### VideoCreator UI Flow
- Animated spinner + status text during rendering (SnapR-branded animation with status underneath)
- Auto-use all listing photos by default, but allow user to deselect/reorder if they want
- Photo selection: default to all enhanced photos, with option to customize

### Photo Ordering
- Smart photo ordering using AI room detection — classify each photo (exterior, living room, kitchen, bedroom, bathroom, backyard, etc.) and auto-order for walkthrough flow: Exterior → Entryway → Living → Kitchen → Dining → Bedrooms → Bathrooms → Outdoor
- User can still manually reorder after AI suggestion if they want

### Claude's Discretion
- Intro card presence (whether to show brief intro card before photos or jump straight into slideshow)
- Ken Burns motion variety (alternate zoom in/out, random pan, or consistent)
- Font style, text casing (uppercase vs title case), and readability approach (gradient backdrop vs text shadow)
- Text overlay positioning per aspect ratio
- Video trigger placement in UI (button in Studio vs dedicated tab)
- Video preview approach (inline player vs modal)
- Post-render actions available (download, share, regenerate)
- Whether to keep existing VideoCreator.tsx layout or rebuild
- Aspect ratio selector style (visual preview boxes vs dropdown)
- Multi-render capability (one at a time vs all 3 at once)
- Photo fill strategy per aspect ratio (crop vs fit with blur)
- Default aspect ratio selection
- Closing card layout adaptation per aspect ratio

</decisions>

<specifics>
## Specific Ideas

- User wants the video to feel like a "virtual tour" — not just a static slideshow, but cinematic motion that flows through the property
- Dark premium theme matching SnapR's existing design language
- Slow crossfades create a dreamy, luxury real estate feel
- Ken Burns motion adds the cinematic walkthrough quality
- Closing card serves as the "summary" — full property details appear here, not cluttering the photo slideshow

</specifics>

<deferred>
## Deferred Ideas

- Interactive virtual tour (Matterport-style 3D walkthrough) — entirely different technology, future milestone
- Smart photo ordering by AI room detection — MOVED TO PHASE 2 (no longer deferred)

</deferred>

---

*Phase: 02-basic-composition-multi-format*
*Context gathered: 2026-02-19*
