## Luxury Glassmorphism Design System

All luxury CSS classes are defined in `app/globals.css` after `@tailwind utilities`, after the `.glass-card-gold` block (~line 93).

| Class | Use case |
|-------|----------|
| `.glass-luxury` | Dark surface cards, panels, modals |
| `.glass-gold-luxury` | Gold-accented banners and CTAs |
| `.glossy-top` | Adds 1px white highlight sheen (pair with above) |
| `.glow-card` | Rotating conic-gradient gold border (CSS Houdini `@property --angle`) |
| `.shimmer-text` | Animated gold gradient text |
| `.stat-glow` | Gold text-shadow on metric values |
| `.bento-grid` | 2-col bento layout; `.bento-span-2` / `.bento-row-2` for spanning |

**Preview sandbox limitation**: Headless preview browser cannot apply custom CSS from Next.js HMR. Verify glass classes via build output:
```bash
npx next build && grep -o "\.glass-luxury[^}]*}" .next/static/css/*.css
```

