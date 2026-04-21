# Design System Specification: High-End Editorial Real Estate

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

This design system is not a utility; it is an exhibition. Tailored for the elite American real estate and architectural photography markets, the system abandons the "boxed-in" feel of traditional SaaS in favor of a high-end editorial experience. 

To achieve this, we utilize **Intentional Asymmetry** and **Tonal Depth**. By breaking the rigid, centered grid and allowing high-resolution imagery to bleed or overlap with sophisticated serif typography, we create a layout that feels like a physical luxury magazine. We prioritize breathing room over information density, ensuring every architectural detail is framed with the reverence it deserves.

---

## 2. Colors & Atmospheric Depth

The palette is rooted in the "Midnight Gold" aesthetic—a high-contrast, dark-mode-first approach that evokes the feeling of a private gallery at night.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders for sectioning or layout containment. Structural boundaries must be defined exclusively through background color shifts. 
*   *Implementation:* A `surface-container-low` section should sit directly on a `surface` background. The shift in value is the boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of obsidian and frosted glass. 
*   **Base:** `surface` (#131313)
*   **Secondary Sections:** `surface-container-low` (#1C1B1B)
*   **Interactive Cards:** `surface-container-high` (#2A2A2A)
*   **Floating Elements:** `surface-container-highest` (#353534) with 80% opacity and 20px backdrop blur.

### The "Glass & Gradient" Rule
To avoid a "flat" digital feel, all primary CTAs and hero highlights must utilize a subtle linear gradient:
*   **Primary Action Gradient:** From `primary` (#F6BE39) to `primary-container` (#D4A017) at a 135° angle.
*   **Overlay Gradients:** Use a 40% opacity gradient from `surface-container-lowest` to transparent over imagery to ensure `on-surface` text remains legible without sacrificing the photo's soul.

---

## 3. Typography: The Editorial Voice

We pair the historical authority of a serif with the clinical precision of a modern sans-serif.

*   **Display & Headlines (Newsreader):** Use for property titles and high-level editorial quotes. These should be set with tighter letter-spacing (-0.02em) to feel "locked" and authoritative.
*   **UI & Body (Inter):** Use for all functional data—square footage, pricing, and navigation. Inter provides the "Tech-Forward" counter-balance to the luxury serif.

**Scale Highlights:**
*   **Display-LG:** 3.5rem (Newsreader). Reserved for hero property names.
*   **Title-MD:** 1.125rem (Inter). Used for secondary data points to maintain high legibility at a glance.
*   **Label-SM:** 0.6875rem (Inter, All Caps, 0.05em tracking). Used for metadata tags (e.g., "SOLD", "NEW LISTING").

---

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through light and opacity, not structural lines.

*   **The Layering Principle:** Depth is achieved by "stacking" tokens. Place a `surface-container-highest` card on a `surface-container-low` background. This creates a soft, natural "lift" that mimics high-end interior lighting.
*   **Ambient Shadows:** For floating modals or dropdowns, use a "Night Glow" shadow: `0px 24px 48px -12px rgba(0, 0, 0, 0.5)`. Never use harsh, dark grey drop shadows.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` token at **15% opacity**. It should feel like a suggestion of an edge, not a cage.
*   **Glassmorphism:** Navigation bars and floating action panels must use `surface-container` with a `backdrop-filter: blur(12px)`. This allows the architectural photography to bleed through the UI, making the interface feel integrated into the environment.

---

## 5. Components & Signature Patterns

### Buttons
*   **Primary:** Gradient (`primary` to `primary-container`), `on-primary` text, `0.25rem` (sm) corner radius.
*   **Secondary:** Ghost style. No background, `outline` token at 20% opacity for the border, `on-surface` text.
*   **States:** On hover, primary buttons should "glow" by increasing the shadow spread, rather than changing color.

### Cards (Property & Portfolio)
*   **Constraint:** Forbid divider lines within cards.
*   **Style:** Use `surface-container-low`. Separate header from body using a `1.4rem` (4) spacing gap.
*   **Interaction:** On hover, the card should transition to `surface-container-high` with a subtle `0.35rem` (1) upward translation.

### Input Fields
*   **Style:** Minimalist. No background. A single bottom-border using `outline-variant` at 30% opacity. 
*   **Focus:** The bottom border transitions to 100% opacity `primary` (#F6BE39).

### Signature Component: The "Perspective Gallery"
For real estate apps, create a component where images overlap. A large `display-md` headline should sit at `z-index: 10`, partially obscured by a secondary architectural detail shot, creating a 3D parallax effect that breaks the standard grid.

---

## 6. Do’s and Don’ts

### Do:
*   **DO** use whitespace as a functional tool. If a screen feels "empty," add more space, not more features.
*   **DO** use `primary` gold sparingly. It is a "high-carat" highlight, not a paint bucket.
*   **DO** ensure all architectural photography is treated with a slight desaturation (5-10%) to better blend with the Midnight palette.

### Don't:
*   **DON'T** use 100% white (#FFFFFF) for body text. Use `on-surface-variant` (#D3C5AE) to reduce eye strain and maintain the "warm" luxury feel.
*   **DON'T** use standard 1px dividers. Use a `0.7rem` (2) vertical gap of empty space instead.
*   **DON'T** use rounded corners larger than `0.5rem` (lg). High-end architecture is defined by clean lines and precision; overly rounded "bubbly" corners degrade the professional tone.