# SVG Diagram Reference

## SVG Setup Template

Always use this base structure:

```svg
<svg width="100%" viewBox="0 0 680 H" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <!-- Content here -->
</svg>
```

- **Width always 680px** via viewBox. `width="100%"` for responsive scaling.
- **H (height)** = bottom-most element's y + height + 40px. Compute it, don't guess.
- **Safe content area**: x=40 to x=640, y=40 to y=(H-40).
- **No wrapping divs**, no `<html>`, `<head>`, `<body>`, or DOCTYPE.
- **Background is transparent** — host provides the background.

---

## Typography

- **Two sizes only**: 14px for titles/labels, 12px for subtitles/descriptions.
- **Two weights only**: 400 (regular), 500 (medium). Never 600 or 700.
- **Font**: `font-family="system-ui, -apple-system, sans-serif"`
- Always set `text-anchor="middle"` and `dominant-baseline="central"` for centered text in boxes.
- **Sentence case always**. Never Title Case or ALL CAPS.

**Text Width Estimation**: At 14px, each character ≈ 8px wide. At 12px ≈ 7px.
- "Load Balancer" (13 chars) at 14px ≈ 104px → needs rect ≈ 140px wide (with padding).
- Rule: `rect_width = max(title_chars × 8, subtitle_chars × 7) + 48px padding`

---

## Color System

Semantic sets that work in both light and dark mode:

```
Teal:   fill="#E1F5EE" stroke="#0F6E56" text="#085041"
Purple: fill="#EEEDFE" stroke="#534AB7" text="#3C3489"
Coral:  fill="#FAECE7" stroke="#993C1D" text="#712B13"
Amber:  fill="#FAEEDA" stroke="#854F0B" text="#633806"
Blue:   fill="#E6F1FB" stroke="#185FA5" text="#0C447C"
Gray:   fill="#F1EFE8" stroke="#5F5E5A" text="#444441"
Red:    fill="#FCEBEB" stroke="#A32D2D" text="#791F1F"
Green:  fill="#EAF3DE" stroke="#3B6D11" text="#27500A"
Pink:   fill="#FBEAF0" stroke="#993556" text="#72243E"
```

**Color meaning, not sequence**: Don't rainbow-cycle. Use 2-3 colors per diagram. Warm = active/energy, cool = calm/cold, gray = structural/neutral.

If CSS variables are available, prefer `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-border-tertiary)`.

---

## Layout & Spacing Rules

- **Stroke width**: 0.5px for borders, 1.5px for arrows/connectors.
- **Corner radius**: `rx="4"` subtle, `rx="8"` emphasized, `rx="20"` large containers.
- **Spacing**: 60px minimum between boxes, 24px padding inside boxes.
- **Single-line box**: 44px tall. **Two-line box**: 56px tall.
- **Max 4-5 nodes per row** at 680px width.
- **All connectors need `fill="none"`** — SVG defaults fill to black.

---

## Component Patterns

### Single-Line Node
```svg
<g>
  <rect x="100" y="20" width="180" height="44" rx="8"
        fill="#EEEDFE" stroke="#534AB7" stroke-width="0.5"/>
  <text x="190" y="42" text-anchor="middle" dominant-baseline="central"
        font-size="14" font-weight="500" fill="#3C3489">Node title</text>
</g>
```

### Two-Line Node
```svg
<g>
  <rect x="100" y="20" width="200" height="56" rx="8"
        fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
  <text x="200" y="38" text-anchor="middle" dominant-baseline="central"
        font-size="14" font-weight="500" fill="#0C447C">Title</text>
  <text x="200" y="56" text-anchor="middle" dominant-baseline="central"
        font-size="12" fill="#185FA5">Short subtitle</text>
</g>
```

### Arrow Connector
```svg
<line x1="200" y1="76" x2="200" y2="120"
      stroke="#534AB7" stroke-width="1.5" marker-end="url(#arrow)"/>
```

### Dashed Flow Indicator
```svg
<line x1="200" y1="76" x2="200" y2="120"
      stroke="#534AB7" stroke-width="1.5" stroke-dasharray="4 3"/>
```

### Leader Line with Annotation
```svg
<line x1="440" y1="100" x2="500" y2="130"
      stroke="currentColor" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.5"/>
<circle cx="440" cy="100" r="2" fill="currentColor" opacity="0.5"/>
<text x="506" y="134" font-size="12" fill="currentColor" opacity="0.7">Annotation text</text>
```

### Large Container
```svg
<rect x="80" y="40" width="520" height="300" rx="20"
      fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text x="340" y="68" text-anchor="middle"
      font-size="14" font-weight="500" fill="#085041">Container name</text>
```

### CSS Animation Patterns
```css
/* Flowing particles */
@keyframes flow { to { stroke-dashoffset: -20; } }
.flowing { stroke-dasharray: 5 5; animation: flow 1.6s linear infinite; }

/* Pulsing glow */
@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
.pulsing { animation: pulse 2s ease-in-out infinite; }

/* Always respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## Diagram Types

### Flowchart
**When**: Sequential processes, decision trees, pipelines.
**Layout**: Top-to-bottom or left-to-right only. Single direction.
- Arrows must never cross unrelated boxes — route around with L-bends.
- Keep same-type boxes the same height. Max 4-5 nodes per diagram.

### Structural Diagram
**When**: Containment matters — things inside other things.
**Layout**: Nested rectangles. Outer = container, inner = regions.
- Max 2-3 nesting levels. 20px minimum padding inside every container.
- Different color ramps for parent vs child to show hierarchy.

### Illustrative Diagram
**When**: Building intuition. "How does X actually work?"
**Layout**: Freeform — follows the subject's natural geometry.
- Shapes can be freeform (paths, ellipses, polygons), not just rects.
- Color encodes intensity, not category (warm = active, cool = dormant).
- Labels go in margins with leader lines.

---

## Critical Pre-Finalization Checks

1. **ViewBox height**: Bottom element max(y + height) + 40px = H.
2. **No content past x=640 or below y=(H-40)**.
3. **Text fits in boxes**: `(chars × 8) + 48 < rect_width`.
4. **No arrows through boxes**: Trace every line — if it crosses a rect, reroute.
5. **All `<path>` connectors have `fill="none"`**.
6. **All text has explicit fill color** — never rely on inheritance.
7. **Colors work in dark mode**.

---

## Multi-Diagram Approach

For complex topics, use multiple smaller SVGs with text between them:
- Each SVG: 3-5 nodes max.
- First diagram = overview, subsequent = zoom into subsections.
- Never promise diagrams you don't deliver.

---

## Tips

- **Less is more**: A clean 4-node diagram teaches better than a cramped 12-node one.
- **Streaming effect**: Structure elements top-down for a natural build-up as tokens arrive.
- **Annotations on the side**: Put labels at x > 560 with leader lines.
- **Consistent heights**: All same-type boxes must be the same height.
- **Whitespace is your friend**: Don't fill every pixel.
